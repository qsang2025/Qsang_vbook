// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /view/<prefix>-<id>-<n>.html (kiem chung live 2026-11-16
// voi 无限之次元征服 ch.1 /view/17-13276-1.html va ch.2, ch.3; va
// 这个学霸过于自律 ch.1 /view/12-20240-1.html):
// - Prefix <prefix> KHAC nhau theo sach (17 o sach mau, 12 o sach 2)
// nen luon lay URL tu muc luc, khong tu suy prefix.
// - Noi dung trong #mycontent (cac <p>); site phan trang theo ~3000 ky
// tu chu khong theo chuong: 1 trang "第N节" co the chua 2 chuong lien
// tiep + tieu de chuong ke tiep (khong noi dung) — tra nguyen trang
// lam 1 chuong, dung nhu site.
// - Chuong 1 co khoi dau trang trong #mycontent: <p>书名 作者：...</p>,
// <p></p>, cac <p> tom tat mo ta, (co the co dong "〇①..."
// chi muc), roi <p>第N章...</p> (tieu de trong noi dung) — cat bo tu
// dau toi dong "第N章" dau tien khi thay chu ky "作者：" trong 3 <p>
// dau, va GIU lai dong tieu de do vi h1 chi co "第N节" (tien le
// tongrenshe — dong tieu de mang ten chuong that). Chuong 2 tro di
// bat dau thang vao noi dung (khong co chu ky), giu nguyen.
// - Cuoi trang co 1 <p> rong — bo cac <p> rong o cuoi.
// - Tieu de trong h1 dang "Ten truyen 第N节" -> lay phan "第N节"
// (khop cach dat ten trong muc luc); neu khong tach duoc thi dung
// nguyen h1.
// - Khong co trang chia trong chuong (khong co 下一页); khong co khoa
// VIP / dang nhap / preview.
// - Link trong #mycontent (neu co) bi go bo, chi giu chu.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
var chapUrl = String(url || "");
if (chapUrl.charAt(0) === "/") chapUrl = siteOrigin() + chapUrl;
chapUrl = normalizeUrl(chapUrl);
var r = fetchPwDoc(chapUrl);
if (r.error) return Response.error(r.error);
var doc = r.doc;

var contentEl = safeFirst(doc.select("#mycontent"));
if (contentEl === null) {
return Response.error("Không đọc được nội dung chương: " + chapUrl);
}
// Go link trong noi dung (quang cao / dieu huong), giu lai chu.
contentEl.select("a").remove();

var ps = contentEl.select("p");
if (ps.size() === 0) {
return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
}

// Cat khoi dau trang o chuong 1: nhan dien bang "作者：" trong 3 <p>
// dau, roi cat toi dong "第N章/第N节" dau tien trong 20 <p> dau
// (GIU lai dong tieu de do vi no mang ten chuong that).
var start = 0;
var hasHeader = false;
var i = 0;
var scan = Math.min(3, ps.size());
for (i = 0; i < scan; i++) {
if (cleanText(ps.get(i).text()).indexOf("作者：")!== -1) { hasHeader = true; break;}
}
if (hasHeader) {
var limit = Math.min(20, ps.size());
for (i = 0; i < limit; i++) {
if (/^第\d+[章节]/.test(cleanText(ps.get(i).text()))) { start = i; break;}
}
if (start === 0) start = Math.min(3, ps.size());
}

var parts = [];
for (i = start; i < ps.size(); i++) {
var t = cleanText(ps.get(i).text());
if (t) parts.push("<p>" + t + "</p>");
}
var html = parts.join("");
if (!html || cleanText(stripTags(html)).length < 20) {
return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
}

// Tieu de chuong: h1 "Ten truyen 第N节" -> lay phan "第N节".
var title = "";
var h1 = safeFirst(doc.select("h1"));
if (h1!== null) {
var raw = cleanText(h1.text());
var m = /(第\d+节.*)/.exec(raw);
if (m) title = m[1];
else title = raw;
}
if (!title) title = "Chương";

return Response.success(html, title);
}
