// chap.js — Doc noi dung chuong TruyenC
load('config.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var contentEl = doc.select("#chapter-content, .chapter-content, .reading-content, article, .content, .prose").first();
    var content = "";

    if (contentEl && contentEl.html()) {
        contentEl.select("script, iframe, .ads, .quangcao, nav, header, footer").remove();
        content = contentEl.html();
    } else {
        doc.select("p").forEach(function(p) {
            var text = p.html();
            if (text && text.length > 20) {
                content += "<p>" + text + "</p>";
            }
        });
    }

    if (!content || content.length < 30) {
        return Response.error("Không tìm thấy nội dung chương.");
    }

    return Response.success(content);
}
