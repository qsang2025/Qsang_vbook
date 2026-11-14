// detail.js — Thong tin chi tiet mot truyen.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var rr = ttlFetchDoc(storyUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var nameEl = selFirst(doc, ".mdv-san-pham-show-name");
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không đọc được thông tin truyện: " + storyUrl);

    var authorEl = selFirst(doc, "a.tac-gia-ten");
    var author = authorEl ? cleanText(authorEl.text()) : "Không rõ";

    var coverEl = selFirst(doc, ".san-pham-book-item-show-image img");
    var cover = coverEl ? normalizeUrl(coverEl.attr("src") || coverEl.attr("data-src") || "") : "";
    if (!cover) {
        var ogImg = selFirst(doc, "meta[property='og:image']");
        if (ogImg) cover = normalizeUrl(ogImg.attr("content") || "");
    }

    var statusEl = selFirst(doc, ".thong-tin-tinh-trang-text");
    var status = statusEl ? cleanText(statusEl.text()) : "";
    // Status cua site ve dang NFD (dau tach roi) nen boc dau truoc khi so.
    var ongoing = stripMarks(status) !== "hoan thanh";

    var descEl = selFirst(doc, ".mdv-san-pham-show-gioi-thieu-des");
    var desc = descEl ? cleanText(descEl.text()) : "";

    var infoParts = [];
    if (author) infoParts.push("Tác giả: " + author);
    if (status) infoParts.push("Tình trạng: " + status);

    var genres = [];
    var genreLinks = doc.select(".san-pham-the-loai-item a");
    var genreNames = [];
    for (var i = 0; i < genreLinks.size(); i++) {
        var a = genreLinks.get(i);
        var href = normalizeUrl(a.attr("href") || "");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        genreNames.push(title);
        genres.push({ title: title, input: href, script: "gen.js" });
    }
    if (genreNames.length > 0) infoParts.push("Thể loại: " + genreNames.join(", "));

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: infoParts.join("<br />"),
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
