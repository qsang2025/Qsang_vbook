// chap.js — Noi dung chuong: tai trang HTML /<slug>/chuong-<num>,
// doc .chapter-content (SSR day du, khong can dang nhap).
// Chuong VIP tra ve thong bao "Chương VIP ... cần mua bằng XU" (0 doan
// <p>) — bao loi tieng Viet ro rang, KHONG mo khoa, KHONG mua ho, KHONG
// dung browser fallback (SSR da tra thong bao khoa; browser cung khong
// doc duoc neu khong dang nhap/mua).
// Kiem chung tu VM 2026-11-13: Đế Bá ch.1 133 doan, mo dau "Be be…be
// be…be be…", nhan vat Lý Thất Dạ; Linh Vũ Thiên Hạ ch.1 34 doan, mo dau
// "- Ưm, ta đang ở nơi nào thế này?", nhan vat Lục Thiếu Du — dung
// truyen goc, doc du.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTvPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var contentEl = safeFirst(doc.select(".chapter-content"));
    if (!contentEl) {
        return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
    }

    var text = cleanText(contentEl.text());
    // Chuong VIP: khong co doan van nao, chi co thong bao mua bang xu.
    if (text.indexOf("Chương VIP") !== -1 || text.indexOf("cần mua bằng XU") !== -1 || text.indexOf("cần mua bằng xu") !== -1) {
        return Response.error("Chương này là chương VIP, cần mua bằng xu trên trang Tiên Vực — extension không mở khóa chương trả phí.");
    }

    contentEl.select("script, style, button, .is-hidden-mobile").remove();
    var paras = contentEl.select("p");
    if (getSize(paras) === 0) {
        return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
    }
    var htmlContent = contentEl.html();
    if (!htmlContent || cleanText(htmlContent).length <= 50) {
        return Response.error("Nội dung chương trống.");
    }

    var title = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1) title = cleanText(h1.text());
    if (!title) {
        try {
            title = cleanText(doc.select("title").text()).split(" - ")[0];
        } catch (e) {
            title = "";
        }
    }
    return Response.success(htmlContent, title);
}
