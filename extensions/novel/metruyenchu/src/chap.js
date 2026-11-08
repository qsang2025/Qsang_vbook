// chap.js — Doc noi dung chuong Me Truyen Chu
load('config.js');

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn chương.");
    url = normalizeUrl(url);

    var response = fetchWithMirrors(url);
    if (!response || !response.ok) return Response.error("HTTP Error: " + (response ? response.status : "không kết nối được máy chủ"));
    var doc = response.html();

    // Tieu de chuong that (data2): "Chuong 1: ..." trong h2.current-chapter.
    var chapTitle = "";
    var chapTitleEl = doc.select("h2.current-chapter").first();
    if (!chapTitleEl) chapTitleEl = doc.select(".chapter-title h2").first();
    if (chapTitleEl) chapTitle = chapTitleEl.text().trim();

    // 1. Selector uu tien: .vung-doc .truyen
    var contentEl = doc.select(".vung-doc .truyen").first();
    if (!contentEl) contentEl = doc.select(".truyen").first();
    if (contentEl) {
        contentEl.select("script, ins, iframe, .ads, .quangcao").remove();
        return Response.success(contentEl.html(), chapTitle);
    }

    // 2. Fallback: .vung-doc
    var vungDoc = doc.select(".vung-doc").first();
    if (vungDoc) {
        vungDoc.select(".chapter-title, .chapter_control, a.back, a.next, a.btn-dschuong, script, ins, iframe").remove();
        return Response.success(vungDoc.html(), chapTitle);
    }

    // 3. Fallback selectors khac
    var fallbackSelectors = [".chapter-c", "#chapter-c", ".chapter-content", "#chapter-content", "#content", ".reading-content", ".content"];
    for (var i = 0; i < fallbackSelectors.length; i++) {
        var el = doc.select(fallbackSelectors[i]).first();
        if (el) {
            el.select("script, ins, iframe").remove();
            return Response.success(el.html(), chapTitle);
        }
    }

    return Response.error("Không tìm thấy nội dung chương.");
}
