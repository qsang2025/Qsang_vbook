// chap.js — doc noi dung mot chuong cua 七猫免费小说 (qimao.com).
// Trang chuong /shuku/<bookid>-<chapterid>/.
//
// NGUON CHINH — API chapter/content (host api-ks.wtzw.com, khong bi chan
// nhu www.qimao.com):
//   GET https://api-ks.wtzw.com/api/v1/chapter/content?id=<bookid>
//       &chapterId=<chapterid>&sign=<md5(sorted "k=v" + key)>
//   (tham so la chapterId camelCase — chapter_id snake_case bi tra loi
//   {"errors": ... "title": "参数错误"}; xem qimao-api.js.)
//   Tra ve data.content = blob base64 giong he file .txt trong ZIP tai
//   toan bo sach: AES-128-CBC, key co dinh "242ccb8230d709e1", IV = 16 byte
//   dau cua blob, padding PKCS#7 (xem qimao-crypto.js; goc: ham _decrypt
//   cua shing-yu/7mao-novel-downloader va decryptChapterContent cua
//   shing-yu/swiftcat-downloader-flutter). Da kiem chung that 2026-11-09:
//   ch.492 (10090611-48385031) tra dung 9.964 ky tu base64, giai ra 2.552
//   chu (2.077 chu Han), khop file ZIP; ch.1 cung khop.
//   Text giai ma: moi doan 1 dong, ngan cach bang \n DON (khong phai
//   \r\n\r\n) — tach theo /\r?\n/ roi boc <p>.
//
// DU PHONG 1 — chapterData tren trang web (CHI LA BAN XEM TRUOC):
//   Trang chuong la Nuxt shell: DOM khong co noi dung, HTML tho co truong
//   chapterData:"<base64>" NHUNG chi dai 760 ky tu, khong phai toan
//   chuong. Dinh dang that (kiem chung offline 2026-11-09 tu blob that
//   ch.492): base64(base64(ciphertext-DES)) + key 32 ky tu cuoi; khoa DES
//   = 8 byte dau cua chuoi hex MD5(key) dang ASCII; DES-ECB, PKCS#7.
//   Giai ra ~100 chu (mo dau chuong, co tag <p>). Xem qimao-des.js.
//   Tra ve kem ghi chu ro "[Bản xem trước …]" de nguoi doc biet no
//   khong day du — KHONG tra nhu chuong day du.
//
// DU PHONG 2 — DOM (khi ca API va chapterData deu hong):
//   .chapter-detail-article, [class*="chapter-detail"], <article>, roi
//   doan text dai nhat.
//
// KHOA CHUONG: moi trang chuong deu hien loi nhac chung "下载
// …" / "在APP端开通会员…" — do KHONG phai khoa. Chi khi nao KHONG co/du
// noi dung (API hong + preview hong + DOM rong/<200 ky tu) KEM loi nhac
// do thi moi bao loi khoa, huong dan mo App / dang nhap会员. Neu noi dung
// giai ma duoc ma ngan hon 20% so chu cong bo (本章字数) thi bao loi thay
// vi tra van ban cut xet (khong ap dung cho ban xem truoc, vi no da ghi
// chu ro la xem truoc).
//
// Ten chuong KHONG tra qua data2 (ten trong <title> dinh kem tac gia
// khong tach duoc sach) — app dung ten chuong tu muc luc (API catalog),
// von la ten that, nen khong can data2.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// cleanHtml.js, crypto.js, qimao-api.js, qimao-crypto.js, rate-limit.js,
// qimao-des.js vao src/. Tuong thich Rhino ES6: chi dung var/function,
// noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('cleanHtml.js');
load('crypto.js');
load('qimao-api.js');
load('qimao-crypto.js');
load('rate-limit.js');
load('qimao-des.js');

// Text thuong: moi doan 1 dong (\n don) -> <p>...</p>.
function plainToHtml(plain) {
var lines = plain.split(/\r\n|\n|\r/);
var html = "";
var i = 0;
for (i = 0; i < lines.length; i++) {
var p = cleanText(lines[i]);
if (p) html += "<p>" + p + "</p>";
}
return cleanHtml(html);
}

function execute(url) {
url = normalizeUrl(url);
var m = url.match(/\/shuku\/(\d+)-(\d+)\/?/);
if (!m) return Response.error("Link chương không đúng định dạng /shuku/<sách>-<chương>/: " + url);
var bookId = m[1];
var chapterId = m[2];

var content = "";
var isPreview = false;

// NGUON CHINH — API chapter/content (api-ks, khong bi chan).
jitterDelay();
var j = qimaoApiGet(QIMAO_API_KS, "/api/v1/chapter/content", { id: bookId, chapterId: chapterId }, bookId);
if (j && j.data && j.data.content) {
var plain = qimaoDecryptChapter(j.data.content);
if (plain && plain.length >= 200) content = plainToHtml(plain);
}

// DU PHONG 1+2 — trang web (chapterData DES preview, roi DOM).
// Lay trang qua pacedFetch (rate-limit.js): nghi jitter 2-3s truoc
// request, retry 429/405/503 toi da 3 lan, ghi cooldown khi bi chan.
// Gap 405/429 (hoac dang cooldown) thi bao loi chan ro rang, KHONG gui
// them request; loi khac thi roi xuong luong cu (trang rong -> bao loi
// chung o cuoi). Khong dung browser fallback khi bi chan theo IP.
var pageText = "";
var wordCount = 0;
var hasAppPrompt = false;
var hasVipPrompt = false;
if (!content) {
var pf = pacedFetch(url, { minDelayMs: 2000, maxDelayMs: 3000 });
var res = null;
if (pf.ok) {
res = pf.res;
} else if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
return Response.error(rateLimitErrorMessage("七猫免费小说", "www.qimao.com", pf.cooldownRemainingMs));
}
if (res) {
var doc = docFromResponse(res, url);
if (doc) {
pageText = doc.text();
hasAppPrompt = pageText.indexOf("下载")!== -1 &&
pageText.indexOf("七猫免费小说APP")!== -1;
hasVipPrompt = pageText.indexOf("开通会员")!== -1;
var wcMatch = pageText.match(/本章字数[:：]\s*(\d+)/);
if (wcMatch) wordCount = parseInt(wcMatch[1], 10);
}
var raw = "";
if (res.browser) {
try { raw = String(res.doc.html());} catch (e) { raw = "";}
} else {
try { raw = String(res.text());} catch (e2) { raw = "";}
}
// Du phong 1: chapterData DES preview (~100 chu).
if (raw) {
var dm = raw.match(/chapterData\s*:\s*"([^"]+)"/);
if (dm) {
var preview = qimaoDesDecryptPreview(dm[1]);
if (preview && /[\u4e00-\u9fff]/.test(preview)) {
var previewHtml = cleanHtml(preview);
if (previewHtml) {
content = "<p><b>[Bản xem trước — mở App 七猫免费小说 để đọc đầy đủ chương này]</b></p>" + previewHtml;
isPreview = true;
}
}
}
}
// Du phong 2: DOM (chi khi preview khong co).
if (!content && doc) {
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
}
}

// Ban xem truoc duoc tra thang (da ghi chu ro, khong ap dung nguong 200 chu).
if (isPreview && content) return Response.success(content);

if (!content || content.length < 200) {
if (hasAppPrompt || hasVipPrompt) {
return Response.error("Chương này chưa đọc được — 七猫 yêu cầu mở trong App 七猫免费小说 (đọc miễn phí) hoặc đăng nhập tài khoản会员 để đọc không quảng cáo trên máy tính: " + url);
}
return Response.error("Không đọc được nội dung chương (API lỗi, trang rỗng, nội dung mã hóa giải không được, hoặc tải chậm bằng JS): " + url);
}
if (wordCount > 0 && content.length < wordCount * 0.2) {
return Response.error("Nội dung chương đọc được quá ngắn so với số chữ công bố (" + content.length + "/" + wordCount + " chữ) — có thể 七猫 đã chặn kiểu hiển thị này trên web, hãy thử mở trong App 七猫: " + url);
}

return Response.success(content);
}
