// chap.js — Doc noi dung chuong Me Truyen Chu
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v4, N1):
// fetch qua fetchPageDoc() (fetchDocWithFallback + kiem challenge, tra
// loi tieng Viet co huong dan khi gap Cloudflare/login).
// Fallback ".content"/"#content" chi nhan khi text dai > 200 ky tu (C3):
// tren trang chuong that co <div class=" content "> la bang cai dat giao
// dien (font chu), chi ~96 ky tu text — khong co guard nay thi fallback
// se tra bang cai dat ve nhu noi dung chuong (kiem chung bang curl
// 2026-11-09; noi dung chuong that ~13.000 ky tu).
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn chương.");
    url = normalizeUrl(url);

    var r = fetchPageDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

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

    // 3. Fallback selectors khac. Rieng ".content"/"#content" qua chung
    // (trang chuong that co <div class=" content "> la bang cai dat giao
    // dien, khong phai noi dung chuong): chi nhan khi text dai > 200 ky
    // tu, neu khong thi bo qua va thu selector sau; ngan qua thi roi
    // xuong loi "Không tìm thấy nội dung chương." nhu cu (C3).
    var fallbackSelectors = [".chapter-c", "#chapter-c", ".chapter-content", "#chapter-content", "#content", ".reading-content", ".content"];
    for (var i = 0; i < fallbackSelectors.length; i++) {
        var el = doc.select(fallbackSelectors[i]).first();
        if (el) {
            var sel = fallbackSelectors[i];
            if (sel === "#content" || sel === ".content") {
                var t = "";
                try { t = el.text(); } catch (e) { t = ""; }
                if (!t || t.trim().length <= 200) continue;
            }
            el.select("script, ins, iframe").remove();
            return Response.success(el.html(), chapTitle);
        }
    }

    return Response.error("Không tìm thấy nội dung chương.");
}
