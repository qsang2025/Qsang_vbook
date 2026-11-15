// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Noi dung o #content, CHI co the <p> (khong script/quang cao — kiem
// chung live 2026-11-15), khong chia trang (khong co "下一页").
// Ten chuong lay tu <h1>. Chuong doc DU, KHONG can dang nhap, khong
// VIP, khong preview (ch.1 大奉打更人: 100 doan <p>, mo dau
// "大奉京兆府，监牢。许七安幽幽醒来…"; ch.2: 89 doan <p>).
// Dung absUrl() thay cho normalizeUrl(): normalizeUrl() khong xu ly
// URL chi co path (vd "/shu/105663/168360795.html") — no tra nguyen
// chuoi, fetch nhan URL tuong doi thi tra fake 504 (bai hoc biqugezz
// 2026-11-15).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    var r = fetchTmDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("#content"));
    if (contentEl === null) {
        var fullText = cleanText(doc.text()).toLowerCase();
        if (fullText.indexOf("登录") !== -1 || fullText.indexOf("登入") !== -1) {
            return Response.error("Chương này có thể yêu cầu đăng nhập.");
        }
        return Response.error("Không tìm thấy nội dung chương.");
    }
    var content = contentEl.html() || "";
    content = content.replace(/<p><\/p>/g, "").replace(/&nbsp;/g, "");
    if (!cleanText(content)) return Response.error("Không tìm thấy nội dung chương.");

    var title = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) title = cleanText(h1.text());
    return Response.success(content, title);
}
