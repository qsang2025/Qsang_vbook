// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Noi dung o article.font_max, cac doan tach nhau bang <br>
// (kiem chung live 2026-11-15). Dau/cuoi bai co dong
// "第(N/M)页" — cat bo. Chuong chia trang: ghep du cac trang
// _2.._M theo so M trong marker (vd ch.1 绝境黑夜 co 3 trang,
// ~8000 ky tu; trang _2/_3 co luc tra 502 tu VM — fetchMtDoc
// thu lai 1 lan, neu van loi thi tra phan doc duoc kem ghi chu).
// Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview
// (ch.1 mo dau "依依..." giac mo; chuong cuoi 625后记 cung doc du).
// Ten chuong lay tu <title> dang "{truyen}_{tac gia}_{chuong}_墨坛文学网".
// Dung absUrl() thay cho normalizeUrl(): normalizeUrl() khong xu ly
// URL chi co path (vd "/juejingheiye/168949/") — no tra nguyen
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

// Doc 1 trang chuong, tra { html, total} (total = M trong
// "第(N/M)页", 0 neu khong co marker) hoac null neu khong doc duoc.
function readChapPage(doc) {
var contentEl = safeFirst(doc.select("article.font_max"));
if (contentEl === null) return null;
var html = contentEl.html() || "";
var total = 0;
var mm = html.match(/第\(\d+\/(\d+)\)页/);
if (mm) total = parseInt(mm[1], 10);
// Cat dong danh so trang o dau va cuoi bai.
html = html.replace(/第\(\d+\/\d+\)页/g, "");
html = html.replace(/&(nbsp|amp|quot|lt|gt);/g, "");
return { html: html, total: total};
}

function execute(url) {
var chapUrl = absUrl(url);
if (!chapUrl) return Response.error("Link chương không hợp lệ.");
var r = fetchMtDoc(chapUrl);
if (r.error) return Response.error(r.error);
var doc = r.doc;

var first = readChapPage(doc);
if (first === null) {
var fullText = cleanText(doc.text()).toLowerCase();
if (fullText.indexOf("登录")!== -1 || fullText.indexOf("登入")!== -1) {
return Response.error("Chương này có thể yêu cầu đăng nhập.");
}
return Response.error("Không tìm thấy nội dung chương.");
}

var content = first.html;
var total = first.total;
var missed = 0;
if (total > 1) {
// URL trang 1 dang /<slug>/<id>/ (tuong duong _1); trang N
// dang /<slug>/<id>_<N>/. Gioi han 20 trang phong thu.
var base = chapUrl.replace(/\/$/, "");
if (total > 20) total = 20;
var n = 2;
for (n = 2; n <= total; n++) {
var nextUrl = base + "_" + n + "/";
var r2 = fetchMtDoc(nextUrl);
if (r2.error) { missed++; continue;}
var extra = readChapPage(r2.doc);
if (extra === null ||!cleanText(extra.html)) { missed++; continue;}
content = content + "<br>" + extra.html;
}
}

if (!cleanText(content)) return Response.error("Không tìm thấy nội dung chương.");
if (missed > 0) {
content = content + "<br><br>";
}

var title = "";
try {
var t = cleanText(doc.select("title").text());
t = t.replace(/_墨坛文学网$/, "");
var parts = t.split("_");
if (parts.length >= 3) title = parts.slice(2).join("_");
else if (parts.length >= 2) title = parts[1];
else title = t;
} catch (e) {
}
return Response.success(content, title);
}
