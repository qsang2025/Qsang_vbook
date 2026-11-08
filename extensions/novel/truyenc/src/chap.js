// chap.js — Doc noi dung chuong TruyenC
//
// Duong doc chuong HTML da verify chay tot tren may that (Linh Kiem Ton
// ch.1 ~8.197 ky tu, ch.5418 ~13.742 ky tu trong <article>) — GIU NGUYEN
// duong nay, chi them: guard url rong, phat hien soft-404 (chuong ngoai
// tam tra HTTP 200 voi title "Chuong khong ton tai" + <article> rong),
// thu hep noi dung CHI trong <article> (ban cu gom moi <p> tren trang
// nen co the lan nav/footer), data2 = tieu de chuong that tu <title>.
load('config.js');
load('fetch-helpers.js');

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn chương.");
    url = normalizeUrl(url);

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được chương truyện: " + url);

    // Tieu de chuong that tu <title>: "Chuong 5424: Dai ket cuc (ha) -
    // Linh Kiem Ton | TruyenC" -> "Chuong 5424: Dai ket cuc (ha)".
    var pageTitle = "";
    var titleEl = doc.select("title").first();
    if (titleEl) pageTitle = titleEl.text().trim();

    // Soft-404: chuong ngoai tam (vi du /chuong-99999) tra HTTP 200 nhung
    // title la "Chuong khong ton tai" va khong co <article>. Chu nay chi
    // kiem trong <title> (chu "khong ton tai" co the xuat hien o noi khac
    // tren trang chuong that) — bao loi ro rang thay vi tra rong success.
    if (pageTitle.indexOf("Chương không tồn tại") !== -1) {
        return Response.error("Chương không tồn tại: " + url);
    }

    var chapterTitle = pageTitle;
    var barIdx = chapterTitle.indexOf(" | TruyenC");
    if (barIdx !== -1) chapterTitle = chapterTitle.substring(0, barIdx);
    var dashIdx = chapterTitle.lastIndexOf(" - ");
    if (dashIdx !== -1) chapterTitle = chapterTitle.substring(0, dashIdx);
    chapterTitle = chapterTitle.trim();

    // Noi dung CHI trong <article> (noi dung chuong that). Neu khong co
    // <article> thi thu cac khoi noi dung chuong chuyen dung; khong bao
    // gio gom moi <p> tren trang (se lan nav/footer/binh luan).
    var content = "";
    var contentEl = doc.select("article").first();
    if (!contentEl) {
        contentEl = doc.select("#chapter-content, .chapter-content, .reading-content").first();
    }
    if (contentEl) {
        contentEl.select("script, iframe, .ads, .quangcao, nav, header, footer").remove();
        if (contentEl.html()) content = contentEl.html();
    }
    if (!content || content.length < 30) {
        return Response.error("Không tìm thấy nội dung chương.");
    }

    return Response.success(content, chapterTitle);
}
