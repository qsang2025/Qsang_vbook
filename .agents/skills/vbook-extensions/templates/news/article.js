// article.js — doc mot bai (template news). Url la link cua bai duoc
// cham trong danh sach; app mo thang reader, khong qua trang detail.
// Content la phan giong doc (TTS) doc — viet thanh doan van that.
// Bai tra phi: neu noi dung trong hoac qua ngan thi bao loi ro rang,
// khong vuot paywall (luat nha).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được bài viết: " + url);

    var content = doc.select("SELECTOR_CONTENT");
    if (content.size() === 0 || cleanText(content.text()).length < 200) {
        return Response.error("Bài viết chưa tải được nội dung đầy đủ (có thể thuộc gói trả phí). Hãy mở bài trong trình duyệt của app để kiểm tra.");
    }

    var tags = [];
    doc.select("SELECTOR_TAGS a").forEach(function (a) {
        var tag = cleanText(a.text());
        if (tag) tags.push(tag);
    });

    return Response.success({
        name: cleanText(doc.select("SELECTOR_TITLE").text()),
        author: cleanText(doc.select("SELECTOR_AUTHOR").text()),
        cover: String(doc.select("meta[property='og:image']").attr("content") || ""),
        time: cleanText(doc.select("SELECTOR_TIME").text()),
        source_name: "Site Name",
        tags: tags,
        content: String(content.html()),
        content_format: "html"
    });
}
