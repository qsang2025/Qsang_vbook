// detail.js — Chi tiet 1 truyen Ky Huyen (kyhuyen.com).
//
// Trang chi tiet `/truyen/<slug>-<so>` (HTML tinh, kiem chung live 2026-11-18):
// - Ten / bia / mo ta ngan / tac gia: meta og:title, og:image,
//   og:description, book:author (du phong h1 span, link tac gia).
// - Mo ta day du: the .para dai nhat tren trang (ban desktop "hide-if-mobile"
//   va ban mobile trong .toggle-content — lay ban dai nhat).
// - Trang thai: .story-stage ("(Dang ra)" / "(Hoan thanh)").
// - The loai: chi link a[href*="tim-kiem?cats="] (link t= la loai truyen
//   "Truyen convert/dich", link s= la nguon "KH" — khong phai the loai).
// - So chuong: dem href chuong duy nhat trong cac tab muc luc (tab "Moi
//   nhat" trung lap 10 chuong moi nhat, dedupe se loai).
// - Cap nhat lan cuoi: text "Cap nhat: ..." tren trang.
// execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");

    var r = fetchKyDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select("meta[property='og:title']").attr("content"));
    if (!name) {
        var h1 = safeFirst(doc.select(".media-body h1"));
        if (h1 !== null) {
            h1.select("a").remove();
            name = cleanText(h1.text());
        }
    }
    if (!name) name = cleanText(doc.select("head > title").text());
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = absUrl(doc.select("meta[property='og:image']").attr("content") || "");
    if (!cover) {
        var coverImg = safeFirst(doc.select(".media-left img.media-object"));
        if (coverImg !== null) cover = absUrl(coverImg.attr("src") || "");
    }

    var author = cleanText(doc.select("meta[property='book:author']").attr("content"));
    if (!author) {
        var authorEl = safeFirst(doc.select(".media-body a[href*=\"/tac-gia/\"]"));
        if (authorEl !== null) author = cleanText(authorEl.text());
    }
    if (!author) author = "Đang cập nhật";

    // Mo ta day du: lay the .para co text dai nhat (desktop + mobile).
    var description = "";
    var paras = doc.select(".para");
    var pi = 0;
    for (pi = 0; pi < paras.size(); pi++) {
        var p = paras.get(pi);
        var t = cleanText(p.text());
        if (t.length > description.length) description = t;
    }
    if (!description) {
        description = cleanText(doc.select("meta[property='og:description']").attr("content"));
    }

    var statusText = "";
    var statusEl = safeFirst(doc.select(".story-stage p"));
    if (statusEl !== null) statusText = cleanText(statusEl.text());
    if (!statusText) statusText = cleanText(doc.select(".story-stage").text());
    var ongoing = statusText.indexOf("Hoàn thành") === -1;
    if (!statusText) statusText = ongoing ? "Đang ra" : "Hoàn thành";

    // So chuong: dem href chuong duy nhat (dedupe ca tab "Moi nhat").
    var chapterCount = 0;
    var seenCh = {};
    doc.select(".tab-chap .chapters ul li a").forEach(function (el) {
        var href = el.attr("href") || "";
        if (href && href.indexOf("/chuong-") !== -1 && !seenCh[href]) {
            seenCh[href] = true;
            chapterCount++;
        }
    });

    // Cap nhat lan cuoi.
    var updated = "";
    var bodyText = doc.text() || "";
    var mUpd = bodyText.match(/Cập nhật:\s*([^\n]+)/);
    if (mUpd) updated = cleanText(mUpd[1]);

    // The loai: chi link cats= (bo link t= loai truyen, s= nguon).
    var genres = [];
    var genreNames = [];
    var seenG = {};
    doc.select(".media-body a[href*=\"tim-kiem?cats=\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        var cm = href.match(/cats=(\d+)/);
        var title = cleanText(el.text());
        if (cm && title && !seenG[cm[1]]) {
            seenG[cm[1]] = true;
            genreNames.push(title);
            genres.push({ title: title, input: "/tim-kiem?cats=" + cm[1], script: "gen.js" });
        }
    });

    var detailParts = [];
    detailParts.push("Tác giả: " + author);
    if (genreNames.length > 0) detailParts.push("Thể loại: " + genreNames.join(", "));
    detailParts.push("Trạng thái: " + statusText);
    if (chapterCount > 0) detailParts.push("Số chương: " + chapterCount + " chương");
    if (updated) detailParts.push("Cập nhật: " + updated);

    // Goi y: truyen cung tac gia + truyen moi cap nhat.
    var suggests = [];
    var authorLinkEl = safeFirst(doc.select(".media-body a[href*=\"/tac-gia/\"]"));
    if (authorLinkEl !== null) {
        var authorHref = authorLinkEl.attr("href") || "";
        if (authorHref) {
            suggests.push({
                title: "Truyện cùng tác giả",
                input: authorHref,
                script: "gen.js"
            });
        }
    }
    suggests.push({
        title: "Truyện mới cập nhật",
        input: "/tim-kiem",
        script: "gen.js"
    });

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join(" • "),
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        host: siteOrigin()
    });
}
