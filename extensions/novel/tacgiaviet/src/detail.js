// detail.js — Thong tin chi tiet mot truyen.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var rr = ttlFetchDoc(storyUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var nameEl = selFirst(doc, ".story-detail-title");
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không đọc được thông tin truyện: " + storyUrl);

    var coverEl = selFirst(doc, ".story-detail-cover img");
    var cover = "";
    if (coverEl) cover = coverEl.attr("src") || coverEl.attr("data-src") || "";

    var authorEl = selFirst(doc, ".story-detail-author-panel-profile strong");
    var author = authorEl ? cleanText(authorEl.text()) : "Không rõ";

    var desc = "";
    var descP = selFirst(doc, ".story-description-content p");
    if (descP) {
        desc = cleanText(descP.text());
    } else {
        var descEl = selFirst(doc, ".story-description-content");
        if (descEl) {
            desc = cleanText(descEl.text());
            desc = desc.replace(/\s*(Xem thêm|Thu gọn)\s*$/, "");
        }
    }

    // Khoi thong tin: moi div co title="gia tri day du" + span nhan.
    var stats = doc.select(".story-detail-stats > div");
    var infoParts = [];
    for (var i = 0; i < stats.size(); i++) {
        var item = stats.get(i);
        var labelEl = selFirst(item, "span");
        var label = labelEl ? cleanText(labelEl.text()) : "";
        if (!label) continue;
        var value = item.attr("title") || "";
        if (!value) {
            var strongEl = selFirst(item, "strong");
            value = strongEl ? cleanText(strongEl.text()) : "";
        }
        // title co the chua ca nhan ("6 độc giả quan tâm") — cat nhan o cuoi.
        var lowVal = value.toLowerCase();
        var lowLabel = label.toLowerCase();
        if (lowVal.length > lowLabel.length && lowVal.indexOf(lowLabel, lowVal.length - lowLabel.length) !== -1) {
            value = cleanText(value.substring(0, value.length - label.length));
        }
        if (value) infoParts.push(label + ": " + value);
    }
    var detail = infoParts.join("<br />");

    var statusEl = selFirst(doc, ".story-detail-meta-status dd");
    var statusText = statusEl ? cleanText(statusEl.text()) : "";
    var ongoing = statusText === "Đang ra";

    var genres = [];
    var tagLinks = doc.select(".story-detail-tags a");
    for (var j = 0; j < tagLinks.size(); j++) {
        var a = tagLinks.get(j);
        var href = a.attr("href") || "";
        var title = cleanText(a.text());
        if (!href || !title) continue;
        genres.push({ title: title, input: normalizeUrl(href), script: "genreList.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: normalizeUrl(cover),
        description: desc,
        detail: detail,
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
