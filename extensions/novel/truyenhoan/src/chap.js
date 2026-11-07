// chap.js — Doc noi dung chuong Truyen Hoan
load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var contentEl = doc.select(".chapter-c, #chapter-c, article, .chapter-content, .entry-content, .noi-dung").first();
    var content = "";

    if (contentEl && contentEl.html()) {
        contentEl.select("script, iframe, .ads, .quangcao, [style*='display:none']").remove();
        content = contentEl.html();
    } else {
        doc.select("p, div[class*='text']").forEach(function(p) {
            var text = p.html();
            if (text && text.length > 10) {
                content += text + "<br>";
            }
        });
    }

    if (!content || content.length < 30) {
        return Response.error("Không tìm thấy nội dung chương");
    }

    return Response.success(content);
}
