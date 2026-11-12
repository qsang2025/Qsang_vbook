// chap.js — Noi dung 1 chuong truyen AkayTruyen (akaytruyen.com).
//
// Trang chuong `/<slug>/chuong-<N>-<ten>` hoac `/<slug>/<N>-chuong-<N>-<ten>`
// (HTML tinh, kiem chung live 2026-11-13): noi dung o div#chapter-content,
// cac the <p> sach (khong script/link/div quang cao ben trong). Chuong
// doc DU ma KHONG can dang nhap (kiem chung ch.1 Con Duong Ba Chu: 58
// doan, mo dau "Nam vua moi tinh giac..."; ch.1 Thien La: 184 doan, mo
// dau "Ben ngoai phong linh cua Thuong Van Thanh, Lam Phong...") — noi
// dung dung truyen goc, khong phai van ban ghep. Tieu de chuong o h1
// (du phong <title>, cat hau to site). Chi bao loi khi khong co doan van
// nao; neu trang day chu "Đăng nhập" thi bao ro chuong co the yeu cau
// dang nhap. Tra ve Response.success(html, tieu de). execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");

    var r = fetchAkDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var title = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) title = cleanText(h1.text());
    if (!title) {
        var titleEl = safeFirst(doc.select("title"));
        if (titleEl !== null) {
            title = cleanText(titleEl.text()).replace(/\s*-\s*[^-]+-\s*Akay.*$/i, "").replace(/\s*-\s*Akay.*$/i, "");
        }
    }

    var contentEl = safeFirst(doc.select("#chapter-content"));
    if (contentEl === null) contentEl = safeFirst(doc.select(".chapter-content"));
    if (contentEl === null) {
        var fullText = cleanText(doc.text()).toLowerCase();
        if (fullText.indexOf("đăng nhập") !== -1 || fullText.indexOf("dang nhap") !== -1) {
            return Response.error("Chương này có thể yêu cầu đăng nhập.");
        }
        return Response.error("Không tìm thấy nội dung chương.");
    }

    contentEl.select("script, style").remove();
    var html = contentEl.html() || "";
    html = html.replace(/<!--[\s\S]*?-->/g, "").trim();
    if (!html) {
        return Response.error("Không đọc được nội dung chương (chương trống).");
    }
    var text = cleanText(contentEl.text());
    if (!text) {
        return Response.error("Không đọc được nội dung chương (chương trống).");
    }

    return Response.success(html, title);
}
