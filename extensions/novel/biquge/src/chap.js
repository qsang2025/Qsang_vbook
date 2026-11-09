// chap.js — doc noi dung mot chuong cua 笔趣阁 (biquge.tw).
//
// DAC THU CUA SITE (khao sat 2026-11-06, da kiem chung tren chuong that):
// - Noi dung chuong nam thang trong HTML SSR: <div class="read-content"
//   id="chaptercontent"> chua cac <p> van ban day du, KHONG ma hoa,
//   KHONG khoa VIP (kiem tra tren 凡人修仙传 chuong 1: 2427 ky tu;
//   异界龙神 chuong cuoi: 974 ky tu).
// - H1 co dang "第一章 山边小村（1 / 1）" — hau to （N / M） la so trang
//   cua chuong. Cac chuong da kiem tra deu (1 / 1), khong thay link
//   下一页; phong truong hop chuong dai bi chia trang, code van theo
//   link 下一页 (toi da 10 trang) roi noi noi dung lai.
// - Tieu de chuong lay tu H1, bo hau to （N / M）.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// challenge-handler.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function chapterTitle(doc) {
    var title = "";
    if (doc !== null) {
        var h1 = doc.select("h1").first();
        if (h1 !== null) title = cleanText(h1.text());
    }
    title = title.replace(/[\uff08\(]\s*\d+\s*\/\s*\d+\s*[\uff09\)]\s*$/, "");
    return title;
}

function contentHtml(doc) {
    var el = doc.select("#chaptercontent").first();
    if (el === null) return "";
    el.select("script, style").remove();
    return el.html();
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) {
        var chRes = fetchWithChallengeHandler(url, { siteName: "笔趣阁" });
        if (chRes && chRes.ok) {
            if (chRes.doc) doc = chRes.doc;
            else if (chRes.html) doc = Html.parse(chRes.html);
        } else if (chRes && chRes.error) {
            return Response.error(chRes.error);
        }
    }
    if (!doc) return Response.error("Không tải được chương: " + url);

    var title = chapterTitle(doc);
    var html = contentHtml(doc);
    if (!html) {
        if (isChallengeDoc(doc)) {
            return Response.error(formatChallengeError("笔趣阁", url));
        }
        // N2 (v4): trang loi cua site tra HTTP 200, tieu de "出错了" —
        // chuong khong ton tai (vd /book/199376/1.html), khong phai loi
        // parse. Kiem chung bang curl 2026-11-09.
        if (isErrorPage(doc)) {
            return Response.error("Chương không tồn tại (link có thể đã đổi): " + url);
        }
        return Response.error("Không đọc được nội dung chương: " + url);
    }

    // Chuong chia nhieu trang: theo link 下一页, noi them noi dung.
    var h1Text = cleanText(doc.select("h1").text());
    var m = h1Text.match(/[\uff08\(]\s*(\d+)\s*\/\s*(\d+)\s*[\uff09\)]/);
    if (m) {
        var cur = parseInt(m[1], 10);
        var total = parseInt(m[2], 10);
        var guard = 0;
        while (cur < total && guard < 10) {
            // C1 (v4): tim link 下一页 bang findLinkByText() (duyet a roi so
            // text) thay cho a:contains(...) — chua co bang chung runtime
            // vBook ho tro pseudo-selector :contains; cac chuong da kiem
            // tra deu (1 / 1) va trang chuong khong co link 下一页 nao nen
            // nhanh nay hien chua tung chay that.
            var nextLink = findLinkByText(doc, ["下一页", "下一頁"]);
            if (nextLink === null) break;
            var nextUrl = absUrl(nextLink.attr("href"));
            if (!nextUrl || nextUrl === url) break;
            jitterDelay();
            var doc2 = fetchDoc(nextUrl);
            if (!doc2) break;
            var extra = contentHtml(doc2);
            if (!extra) break;
            html += extra;
            doc = doc2;
            url = nextUrl;
            cur++;
            guard++;
        }
    }

    return Response.success(html, title);
}
