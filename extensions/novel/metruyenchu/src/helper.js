// helper.js — Ham dung chung cho Me Truyen Chu (N1/N2, v4).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day (load khong de quy). Script nao dung
// helper nay phai load truoc theo thu tu:
//     file config.js;
//     file fetch-helpers.js;
//     file challenge-handler.js;
//     file helper.js;
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Parse danh sach truyen kieu grid/list: ".truyen-list .item" (dung chung
// cho search.js va gen.js — truoc day hai file trung lap ~40 dong parse
// nay, sua selector o mot file ma quen file kia se lech). Tra ve mang cac
// { name, link, cover, description, host }. Link/cover lay dung nhu
// href/src tren trang (co the la URL tuong doi); app tu xu ly theo host.
function parseStoryItems(doc) {
    var novelList = [];
    doc.select(".truyen-list .item").forEach(function (e) {
        var titleEl = e.select("h3 a").first();
        if (!titleEl) return;

        var name = titleEl.text().trim();
        var link = titleEl.attr("href");
        if (!name || !link) return;

        var cover = "";
        var coverEl = e.select(".cover img").first();
        if (coverEl) {
            cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        }

        var desc = "";
        var authorEl = safeFirst(e.select("a[href*='/tac-gia/']"));
        if (authorEl) {
            desc = "Tác giả: " + authorEl.text().trim();
        }

        novelList.push({
            name: name,
            link: link,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    });
    return novelList;
}

// Fetch trang HTML co failover mirror + xu ly Cloudflare challenge.
//
// Duong chinh: fetchDocWithFallback(url, MIRROR_LIST) tu fetch-helpers.js
// (retry 429, quet marker challenge ca khi HTTP 200, thu browser fallback
// truoc khi bo cuoc) — khong parse trang challenge nhu trang that nua.
// Site chinh hien chua bat challenge (kiem chung bang curl 2026-11-09:
// home/search/detail/chap deu 200, khong co marker challenge); helper
// nay la phong thu cho ngay site bat challenge (cung ha tang Cloudflare
// voi wikidichvn.com von da chan 403 tu VM).
//
// Tra ve { doc: Document } khi thanh cong, hoac { error: "thong bao tieng
// Viet" } khi that bai. Caller dung:
//     var r = fetchPageDoc(url);
//     if (r.error) return Response.error(r.error);
//     var doc = r.doc;
//
// Khi duong chinh that bai, fetch lai 1 lan bang fetchWithMirrors() de
// phan biet challenge/login voi loi mang/HTTP (chi chay tren duong that
// bai, khong ton them request khi trang tai binh thuong): gap challenge
// thi tra huong dan vuot qua cua formatChallengeError(), gap trang yeu
// cau dang nhap thi tra formatLoginError(), con lai thi bao loi HTTP
// chung. KHONG tu y tra ve trang challenge da parse thanh doc that.
function fetchPageDoc(url) {
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (doc) return { doc: doc };

    var res = null;
    var text = "";
    try {
        res = fetchWithMirrors(url);
        if (res) {
            try { text = String(res.text() || ""); } catch (e1) {}
        }
    } catch (e) {
        res = null;
    }
    if (isCloudflareChallenge(text, res ? res.headers : null)) {
        return { error: formatChallengeError("Mê Truyện Chữ", url) };
    }
    if (isLoginRequired(text, url)) {
        return { error: formatLoginError("Mê Truyện Chữ", url) };
    }
    return { error: "Không tải được trang (HTTP " + (res ? res.status : "không kết nối được máy chủ") + "): " + url };
}
