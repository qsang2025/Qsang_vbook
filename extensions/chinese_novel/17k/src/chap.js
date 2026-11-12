// chap.js — noi dung mot chuong 17k (/chapter/<bookId>/<chapterId>.html).
//
// PHAN BIET MIEN PHI / VIP (kiem chung live 2026-11-12):
// - Chuong mien phi: co div.readAreaBox.content > div.p chua toan bo
//   doan van (<p>). Tieu de o div.readAreaBox.content h1.
// - Chuong VIP: KHONG co div.readAreaBox; chi co div.content chua 2 doan
//   xem truoc + dong <p class="copy"> "VIP章节, 余下还有N个段落 ..."
//   (chi la teaser, khong phai noi dung day du) — KHONG tra teaser ve
//   nhu chuong that; tra Response.error tieng Viet ro rang, bao nguoi
//   dung dang nhap/mua tren web 17k.com. Extension CHI doc chuong mien phi.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url).replace("h5.17k.com", "www.17k.com");
    var fullUrl = BASE_URL + url;
    var response = fetchPage(fullUrl);
    if (!response || !response.ok) return Response.error("Không tải được chương (HTTP " + (response ? response.status : 0) + ")");
    var doc = response.html();

    var contentEl = safeFirst(doc.select("div.readAreaBox.content > div.p"));
    if (contentEl) {
        var text = cleanText(contentEl.text());
        if (text) {
            contentEl.select("p.copy, #banner_content, div.qrcode, div.chapter_text_ad, div.author-say").remove();
            var titleEl = safeFirst(doc.select("div.readAreaBox.content h1"));
            var title = titleEl ? cleanText(titleEl.text()) : "";
            var html = contentEl.html().replace(/<!--[\s\S]*?-->/g, "");
            return Response.success(html, title);
        }
    }

    var bodyText = "";
    try {
        bodyText = doc.select("body").text();
    } catch (e) {
    }
    if (bodyText.indexOf("VIP章节") !== -1 || bodyText.indexOf("余下还有") !== -1) {
        return Response.error("Chương VIP — cần đăng nhập và mua trên web 17k.com mới đọc được. Extension chỉ đọc các chương miễn phí.");
    }
    return Response.error("Không đọc được nội dung chương (chương có thể đã bị khóa hoặc site đổi giao diện)");
}
