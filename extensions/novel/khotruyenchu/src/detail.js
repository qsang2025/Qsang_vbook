// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
// Layout da kiem chung cua khotruyenchu.fun:
//   h1.truyen-title              ten truyen
//   .truyen-cover img            anh bia (webp goc)
//   .truyen-meta span            "Tac gia: <a class=meta-link href=/tac-gia/?tg=...>"
//                                "The loai: <a class=meta-link href=/the-loai/...>"
//                                "Tinh trang: Dang tien hanh / Hoan thanh"
//   .truyen-desc                 gioi thieu
//   .truyen-list-title .count    so chuong ("1.597 chuong")
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("khotruyenchu.fun", 500, 1500);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = cleanText(doc.select("h1.truyen-title").text());
    if (!name) return Response.error("Không đọc được tên truyện từ " + url);

    var cover = "";
    var coverEl = safeFirst(doc.select(".truyen-cover img"));
    if (coverEl) cover = String(coverEl.attr("src") || "");

    var author = "";
    var genres = [];
    var seen = {};
    var metaLinks = doc.select(".truyen-meta a.meta-link");
    var i = 0;
    for (i = 0; i < metaLinks.size(); i++) {
        var a = metaLinks.get(i);
        var href = String(a.attr("href") || "");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        if (href.indexOf("/tac-gia/") !== -1) {
            if (!author) author = title;
        } else if (href.indexOf("/the-loai/") !== -1) {
            var input = absUrl(href);
            if (!seen[input]) {
                seen[input] = true;
                genres.push({ title: title, input: input, script: "book.js" });
            }
        }
    }

    var statusText = cleanText(doc.select(".truyen-meta").text());
    var ongoing = statusText.indexOf("Hoàn thành") === -1;

    var descEl = safeFirst(doc.select(".truyen-desc"));
    var description = descEl ? String(descEl.html() || "") : "";

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (statusText.indexOf("Đang tiến hành") !== -1) detailParts.push("Tình trạng: Đang tiến hành");
    else if (statusText.indexOf("Hoàn thành") !== -1) detailParts.push("Tình trạng: Hoàn thành");
    var countText = cleanText(doc.select(".truyen-list-title").text());
    if (countText) detailParts.push(countText);
    detailParts.push("Nguồn: Kho Truyện Chữ");

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join("<br>"),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
