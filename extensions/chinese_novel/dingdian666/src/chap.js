// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Noi dung o #txt, cac doan tach nhau bang <br> (khong co <p> — kiem
// chung live 2026-11-15). Dau #txt co 1 the <a> quang cao
// "一秒记住 dingdian666.com，更新快，无弹窗！" — xoa ca the
// <a> (ke theo base cu) truoc khi tra ve. Chuong doc DU, KHONG can
// dang nhap, khong VIP, khong preview (ch.1 天师神医: 2486 ky tu,
// mo dau "前往上京市的火车上，王欢坐在挨窗位置…").
// Phong thu chia trang: neu trong trang co link chuong dang
// <chapterid>_2.html thi tai them va noi vao (ch.1 khong co nen
// chua kiem chung duoc duong nay).
// Ten chuong lay tu <title> dang "{truyen}_{chuong}_{tac gia}_顶点小说".
// Dung absUrl() thay cho normalizeUrl(): normalizeUrl() khong xu ly
// URL chi co path (vd "/zhangjie/47418/15616089.html") — no tra nguyen
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

function readTxt(doc) {
var contentEl = safeFirst(doc.select("#txt"));
if (contentEl === null) return null;
var html = contentEl.html() || "";
html = html.replace(/<a[^>]*>([^<]*)<\/a>/g, "");
html = html.replace(/&(nbsp|amp|quot|lt|gt);/g, "");
return html;
}

function execute(url) {
var chapUrl = absUrl(url);
if (!chapUrl) return Response.error("Link chương không hợp lệ.");
var r = fetchDdDoc(chapUrl);
if (r.error) return Response.error(r.error);
var doc = r.doc;

var content = readTxt(doc);
if (content === null) {
var fullText = cleanText(doc.text()).toLowerCase();
if (fullText.indexOf("登录")!== -1 || fullText.indexOf("登入")!== -1) {
return Response.error("Chương này có thể yêu cầu đăng nhập.");
}
return Response.error("Không tìm thấy nội dung chương.");
}

var base = chapUrl.replace(/\.html$/, "");
var n = 2;
while (n <= 10) {
var nextUrl = base + "_" + n + ".html";
var nextPath = nextUrl.replace(/^https?:\/\/[^\/]+/, "");
var found = false;
var all = doc.select("a[href]");
var j = 0;
for (j = 0; j < all.size(); j++) {
var h = all.get(j).attr("href") || "";
if (h === nextUrl || h === nextPath) { found = true; break;}
}
if (!found) break;
var r2 = fetchDdDoc(nextUrl);
if (r2.error) break;
var extra = readTxt(r2.doc);
if (extra === null ||!cleanText(extra)) break;
content = content + "<br>" + extra;
doc = r2.doc;
n = n + 1;
}

if (!cleanText(content)) return Response.error("Không tìm thấy nội dung chương.");

var title = "";
try {
var t = cleanText(doc.select("title").text());
t = t.replace(/_顶点小说$/, "");
var parts = t.split("_");
if (parts.length >= 2) title = parts[1];
else title = t;
} catch (e) {
}
return Response.success(content, title);
}
