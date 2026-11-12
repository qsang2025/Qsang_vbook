// helper.js — Ham dung chung cho 52书库 (52shuku.net).
//
// Site WordPress-like, HTML tinh phia server (kiem chung live 2026-11-13):
// - Danh sach truyen: the `article.excerpt` (trang the loai, ~25-27
// truyen/trang, phan trang /index_<N>.html); ten o h2 > a (dang
// "<ten>_<tac gia>"); mo ta o span.note; ngay o p.auth-span.
// Trang the loai co 2 muc khong phai truyen (goi y dau trang + goi y tac
// gia) — ca 2 deu khong co.auth-span va link khong chua "_b/".
// Trang /nan/, /DanMei/, /QiTa/, /Top/, /tuijian/ la trang goi y, KHONG
// co article.excerpt nen khong dung lam tab/the loai.
// - Tim kiem HOAT DONG qua GET /so/search.php?q=<tu khoa> (kiem chung:
// "裂天空骑" tra 1 ket qua dung, "重生" tra 20 ket qua); tham so page=2
// tra giong het trang 1 (site khong phan trang ket qua) nen search.js
// luon tra data2 = "". Link ket qua co 2 dang: /<cat>/<NN>_b/<hash>.html
// va dang rut gon /<cat>/<hash>.html (ca 2 deu mo truc tiep duoc, 200).
// - Chi tiet: /<cat>/<NN>_b/<hash>.html (hoac dang rut gon); h1 dang
// "<ten>_<tac gia>" hoac "" / ""; mo ta o
// article.article-content p[1] (chi co ~160 ky tu: gioi thieu + 2 doan
// dau ch.1); trang thai lay tu h1; chuyen muc o p "所属专题：<tag>".
// Site gan nhu chi co truyen HOAN THANH (kiem chung trang chu + 3 trang
// the loai: 0 chu "连载") nen duong ongoing=true chua gap case that.
// - Muc luc: ul.list.clearfix li.mulu a, TAT CA tren 1 trang chi tiet
// (vd 1.347 muc), ten muc la "第N页" — site phan trang TOAN BO VAN BAN
// truyen chu khong phan theo chuong: trang chi tiet la trang 1 (chi co
// teaser), _2.html la trang 2 (chua TRON ch.1 + dau ch.2),... _1348.html
// la trang cuoi. Khong can page.js.
// - Chuong: moi trang _N.html co ~87 the <p> trong.article-content;
// 7 doan dau lap lai khoi gioi thieu sach, doan cuoi la "传送门" + dong
// quang cao — chap.js cat bo ca hai dau. Chuong doc DU, KHONG can dang
// nhap, khong VIP, khong preview (kiem chung ch.1 裂天空骑: 80 doan that,
// mo dau "高低起伏不停的茫茫兴都枯什山脉中..." — dung noi dung goc,
// khong phai van ban ghep nhu cgsdlx).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter, retry 429/405/503, tu ghi cooldown khi bi chan. Neu domain chinh
// loi mang/5xx thi thu lan luot cac mirror trong MIRROR_LIST (cung pacing).
// Tra ve { doc: Document} khi thanh cong, hoac { error: "tieng Viet"}.
function fetch52Doc(url) {
var candidates = [url];
var i = 0;
for (i = 0; i < MIRROR_LIST.length; i++) {
var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
if (alt!== url) candidates.push(alt);
}
var lastError = "";
for (i = 0; i < candidates.length; i++) {
var res = null;
try {
res = pacedFetch(candidates[i], {});
} catch (e) {
lastError = "Không tải được trang (lỗi mạng): " + url;
continue;
}
if (!res) {
lastError = "Không tải được trang: " + url;
continue;
}
if (res.error === "cooldown") {
return { error: rateLimitErrorMessage("52书库", pacedHostOf(candidates[i]), res.cooldownRemainingMs)};
}
if (!res.ok) {
var st = res.status || 0;
if (st === 429 || st === 405) {
return { error: rateLimitErrorMessage("52书库", pacedHostOf(candidates[i]), res.cooldownRemainingMs)};
}
if (st) {
lastError = "Không tải được trang (HTTP " + st + "): " + url;
continue;
}
lastError = "Không tải được trang (lỗi mạng): " + url;
continue;
}
var doc = null;
try {
doc = docFromResponse(res.res, candidates[i]);
} catch (e2) {
lastError = "Không đọc được nội dung trang: " + url;
continue;
}
if (!doc) {
lastError = "Không đọc được nội dung trang: " + url;
continue;
}
return { doc: doc};
}
return { error: lastError || ("Không tải được trang: " + url)};
}

// Link truyen hop le: dang /<cat>/<NN>_b/<hash>.html hoac dang rut gon
// /<cat>/<hash>.html; loai link trang goi y (/tuijian/..., /zuozhe/...),
// trang tinh (/about.html, /bookcase.html, /ZhiNan.html) va link chuong
// (/_<N>.html).
function isStoryLink(href) {
if (!href) return false;
var s = String(href).replace(/[?#].*$/, "").replace(/\/+$/, "");
if (s.indexOf("/tuijian/")!== -1) return false;
if (s.indexOf("/zuozhe/")!== -1) return false;
if (s.indexOf("/about.html")!== -1) return false;
if (s.indexOf("/bookcase.html")!== -1) return false;
if (s.indexOf("/ZhiNan.html")!== -1) return false;
if (/_\d+\.html$/i.test(s)) return false;
if (!/\.html$/i.test(s)) return false;
var parts = s.split("/");
// Dang /<cat>/<hash>.html (2 doan cuoi) hoac /<cat>/<NN>_b/<hash>.html.
if (parts.length < 2) return false;
return true;
}

// Tach "ten_tacgia" (vd "裂天空骑_华表") thanh
// { name, author, status} — status la chu trong, co the la
// "完结", "完结+番外", "连载". Neu khong co "_" thi author = "".
function parseTitleAuthor(raw) {
var s = cleanText(raw);
var status = "";
// Lay chu trong cap 【】 cuoi cung (vd "完结", "完结+番外", "连载").
var openIdx = s.lastIndexOf("【");
var closeIdx = s.lastIndexOf("】");
if (openIdx !== -1 && closeIdx === s.length - 1 && closeIdx > openIdx) {
status = s.substring(openIdx + 1, closeIdx);
s = s.substring(0, openIdx);
}
var name = s;
var author = "";
var idx = s.lastIndexOf("_");
if (idx > 0) {
name = cleanText(s.substring(0, idx));
author = cleanText(s.substring(idx + 1));
}
return { name: name, author: author, status: status};
}

// Parser 1 dong truyen trong article.excerpt (trang the loai / tim kiem).
// Tra ve doi tuong truyen hoac null neu khong phai dong truyen.
function parseExcerpt(el) {
var linkEl = safeFirst(el.select("h2 a"));
if (linkEl === null) linkEl = safeFirst(el.select("a"));
if (linkEl === null) return null;
var link = absUrl(linkEl.attr("href"));
if (!isStoryLink(link)) return null;
var name = cleanText(linkEl.text());
if (!name) return null;
var noteEl = safeFirst(el.select("span.note"));
var desc = noteEl === null? "": cleanText(noteEl.text());
return {
name: name,
cover: "",
link: link,
description: desc,
tag: "",
host: siteOrigin()
};
}

// Parser ca danh sach article.excerpt: duyet cac dong, bo trung theo link.
function parseBookList(doc) {
var items = [];
var seen = {};
var rows = doc.select("article.excerpt");
var i = 0;
for (i = 0; i < rows.size(); i++) {
var item = parseExcerpt(rows.get(i));
if (item &&!seen[item.link]) {
seen[item.link] = true;
items.push(item);
}
}
return items;
}

// Mau tieu de chuong trong van ban: "第1章...", "第十二章...", "楔子",
// "序章", "引子", "前言". Dung de cat khoi gioi thieu lap lai o dau trang
// chuong va lam tieu de tra ve (data2) cho chap.js.
function isChapterHeading(text) {
var s = cleanText(text);
if (/^第[0-9一二三四五六七八九十百千]+章/.test(s)) return true;
if (/^(楔子|序章|引子|前言|序言|第[0-9一二三四五六七八九十百千]+卷)/.test(s)) return true;
return false;
}
