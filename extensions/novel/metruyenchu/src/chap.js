// chap.js — Doc noi dung chuong Me Truyen Chu
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

    // 1. Selector uu tien: .vung-doc .truyen
    var contentEl = doc.select(".vung-doc .truyen").first();
    if (!contentEl) contentEl = doc.select(".truyen").first();
    if (contentEl) {
        contentEl.select("script, ins, iframe, .ads, .quangcao").remove();
        return Response.success(contentEl.html());
    }

    // 2. Fallback: .vung-doc
    var vungDoc = doc.select(".vung-doc").first();
    if (vungDoc) {
        vungDoc.select(".chapter-title, .chapter_control, a.back, a.next, a.btn-dschuong, script, ins, iframe").remove();
        return Response.success(vungDoc.html());
    }

    // 3. Fallback selectors khac
    var fallbackSelectors = [".chapter-c", "#chapter-c", ".chapter-content", "#chapter-content", "#content", ".reading-content", ".content"];
    for (var i = 0; i < fallbackSelectors.length; i++) {
        var el = doc.select(fallbackSelectors[i]).first();
        if (el) {
            el.select("script, ins, iframe").remove();
            return Response.success(el.html());
        }
    }

    return Response.error("Không tìm thấy nội dung chương.");
}
