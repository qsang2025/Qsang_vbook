// detail.js — Thong tin chi tiet mot truyen.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var rr = ttlFetchDoc(storyUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var bigInfo = selFirst(doc, ".biginfo");
    if (!bigInfo) return Response.error("Không đọc được thông tin truyện: " + storyUrl);

    var nameEl = selFirst(bigInfo, "h1");
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không đọc được thông tin truyện: " + storyUrl);

    var coverEl = selFirst(bigInfo, ".cover img");
    var cover = coverEl ? normalizeUrl(coverEl.attr("src") || "") : "";
    if (!cover) {
        var ogImg = selFirst(doc, "meta[property='og:image']");
        if (ogImg) cover = normalizeUrl(ogImg.attr("content") || "");
    }

    // Tac gia: link a[href^='//user'] dau tien trong .biginfo la avatar
    // (khong co text); lay link dau tien co text.
    var author = "Không rõ";
    var authorLinks = bigInfo.select("a[href^='//user']");
    for (var i = 0; i < authorLinks.size(); i++) {
        var t = cleanText(authorLinks.get(i).text());
        if (t && t !== "作者") {
            author = t;
            break;
        }
    }

    var statusEl = selFirst(bigInfo, ".bg-dwarning");
    var status = statusEl ? cleanText(statusEl.text()) : "";
    var ongoing = status.indexOf("完结") === -1;

    var descEl = selFirst(doc, ".aboutbook");
    var desc = descEl ? cleanText(descEl.text()) : "";

    var infoParts = [];
    if (author) infoParts.push("Tác giả: " + author);
    if (status) infoParts.push("Tình trạng: " + status);

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: infoParts.join("<br />"),
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing
    });
}
