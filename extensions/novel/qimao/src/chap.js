// chap.js — doc noi dung mot chuong cua 七猫免费小说 (qimao.com).
// Trang chuong /shuku/<bookid>-<chapterid>/ (khao sat 2026-11-09):
//
// NGUON CHINH — chapterData ma hoa trong __NUXT__ state:
// Trang chuong la Nuxt shell: DOM khong co noi dung (body text chi
// ~412 ky tu: nav + loi nhac tai App), nhung HTML tho co truong
// chapterData:"<base64>" — noi dung chuong ma hoa AES-128-CBC,
// key co dinh "242ccb8230d709e1", IV = 16 byte dau cua blob, padding
// PKCS#7 (xem qimao-crypto.js; goc: ham _decrypt cua
// shing-yu/7mao-novel-downloader va decryptChapterContent cua
// shing-yu/swiftcat-downloader-flutter — ca hai khop nhau).
// Giai ma xong la text thuong, cac doan ngan cach \r\n.
// CHUA kiem chung giai ma that (www.qimao.com dang bi 405 tu may —
// xem README): neu tra rac/rong thi kiem tra key truoc tien.
// Ten chuong KHONG tra qua data2 (ten trong <title> dinh kem tac gia
// khong tach duoc sach) — app dung ten chuong tu muc luc (API catalog),
// von la ten that, nen khong can data2.
//
// DU PHONG — DOM (khi chapterData vang mat):
//.chapter-detail-article (theo skill TypingMind), [class*="chapter-detail"],
// <article>, roi doan text dai nhat.
//
// KHOA CHUONG: moi trang chuong deu hien loi nhac chung "下载
// …" / "在APP端开通会员…" — do KHONG phai khoa. Chi khi nao KHONG co/du
// noi dung (giai ma rong + DOM rong/<200 ky tu) KEM loi nhac do thi moi
// bao loi khoa, huong dan mo App / dang nhap会员. Neu noi dung giai ma
// duoc ma ngan hon 20% so chu cong bo (本章字数) thi bao loi thay vi tra
// van ban cut xet.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// cleanHtml.js, qimao-crypto.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('cleanHtml.js');
load('qimao-crypto.js');

function execute(url) {
url = normalizeUrl(url);
var res = fetchPage(url);
if (!res) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);
var doc = docFromResponse(res, url);
if (!doc) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);

var raw = "";
if (res.browser) {
try { raw = String(res.doc.html());} catch (e) { raw = "";}
} else {
try { raw = String(res.text());} catch (e2) { raw = "";}
}

var pageText = doc.text();
var hasAppPrompt = pageText.indexOf("下载")!== -1 &&
pageText.indexOf("七猫免费小说APP")!== -1;
var hasVipPrompt = pageText.indexOf("开通会员")!== -1;

var wordCount = 0;
var wcMatch = pageText.match(/本章字数[:：]\s*(\d+)/);
if (wcMatch) wordCount = parseInt(wcMatch[1], 10);

// Nguon chinh: giai ma chapterData trong __NUXT__.
var content = "";
if (raw) {
var dm = raw.match(/chapterData\s*:\s*"([^"]+)"/);
if (dm) {
var plain = qimaoDecryptChapter(dm[1]);
if (plain) {
// Text thuong: \r\n ngan cach doan -> <p>...</p>.
var paras = plain.split(/\r\n\r\n|\n\n|\r\r/);
var html = "";
var i = 0;
for (i = 0; i < paras.length; i++) {
var p = cleanText(paras[i].replace(/\r\n/g, " ").replace(/\n/g, " "));
if (p) html += "<p>" + p + "</p>";
}
content = cleanHtml(html);
}
}
}

// Du phong: DOM (khi khong co chapterData hoac giai ma hong).
if (!content) {
var html2 = "";
var article = doc.select(".chapter-detail-article").first();
if (article!== null) html2 = article.html();
if (!html2) {
var alt = doc.select('[class*="chapter-detail"]').first();
if (alt!== null) html2 = alt.html();
}
if (!html2) {
var art = doc.select("article").first();
if (art!== null) html2 = art.html();
}
if (html2) {
content = cleanHtml(html2);
content = content.replace(/书名[:：][^<]{0,60}/g, "");
content = content.replace(/本章字数[:：]\s*\d+/g, "");
content = content.replace(/更新时间[:：]\s*[\d\-:]+/g, "");
content = content.trim();
}
}

if (!content || content.length < 200) {
if (hasAppPrompt || hasVipPrompt) {
return Response.error("Chương này chưa đọc được trên web — 七猫 yêu cầu mở trong App 七猫免费小说 (đọc miễn phí) hoặc đăng nhập tài khoản会员 để đọc không quảng cáo trên máy tính: " + url);
}
return Response.error("Không đọc được nội dung chương (trang rỗng, nội dung mã hóa giải không được, hoặc tải chậm bằng JS): " + url);
}
if (wordCount > 0 && content.length < wordCount * 0.2) {
return Response.error("Nội dung chương đọc được quá ngắn so với số chữ công bố (" + content.length + "/" + wordCount + " chữ) — có thể 七猫 đã chặn kiểu hiển thị này trên web, hãy thử mở trong App 七猫: " + url);
}

return Response.success(content);
}
