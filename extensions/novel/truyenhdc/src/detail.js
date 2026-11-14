// detail.js — Chi tiet truyen TruyenHD (truyenhdc.com).
//
// Trang chi tiet /truyen/<slug>/: ten o h1, tac gia o .item-user
// (attr title — site khong co link tac-gia rieng; du phong: tach
// tu <title> dang "Ten truyen - Tac gia - ..."), bia .book3d img
// (data-src truoc, src sau), mo ta o .excerpt-full (an, du) hoac
// .excerpt-collapse (cat ngan), thong tin o #thong_tin (Tinh Trang:
// Hoan Thanh / Dang Cap Nhat; the loai o .keywords a).
// Site co noi dung 18+ nen detail tra nsfw: true.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link truyện không hợp lệ.");
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var h1El = selFirst(doc, "h1");
    if (h1El) name = cleanText(h1El.text());
    if (!name) return Response.error("Không đọc được thông tin truyện: " + full);

    var author = "";
    var userEl = selFirst(doc, ".item-user");
    if (userEl) author = cleanText(userEl.attr("title") || "");
    if (!author) {
        var titleEl = selFirst(doc, "title");
        if (titleEl) {
            var parts = cleanText(titleEl.text()).split(" - ");
            if (parts.length >= 3) author = parts[1];
        }
    }

    var cover = "";
    var imgEl = selFirst(doc, ".book3d img");
    if (imgEl) cover = normalizeUrl(imgEl.attr("data-src") || imgEl.attr("src") || "");

    var description = "";
    var descEl = selFirst(doc, ".excerpt-full");
    if (!descEl) descEl = selFirst(doc, ".excerpt-collapse");
    if (descEl) description = cleanText(descEl.text());
    if (!description) {
        var metaEl = selFirst(doc, "meta[name=description]");
        if (metaEl) description = cleanText(metaEl.attr("content") || "");
    }

    var infoEl = selFirst(doc, "#thong_tin");
    var detail = infoEl ? infoEl.html() : "";
    var infoText = infoEl ? infoEl.text() : "";
    var ongoing = true;
    if (infoText.indexOf("Hoàn Thành") >= 0) ongoing = false;
    else if (infoText.indexOf("Đang Cập Nhật") >= 0) ongoing = true;

    var genres = [];
    var seen = {};
    doc.select("#thong_tin .keywords a").forEach(function (el) {
        var t = cleanText(el.text());
        var href = el.attr("href") || "";
        if (!t || !href) return;
        if (seen[href]) return;
        seen[href] = true;
        genres.push({ title: t, input: href, script: "gen.js" });
    });

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: full,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        nsfw: true,
        genres: genres,
        tags: [],
        suggests: [],
        reviews: [],
        comments: []
    });
}
