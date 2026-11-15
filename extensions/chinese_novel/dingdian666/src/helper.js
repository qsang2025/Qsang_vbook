// helper.js — Ham dung chung cho 顶点小说 (dingdian666.com).
//
// Site HTML tinh phia server, UTF-8 (kiem chung live 2026-11-15):
// - Trang chu 200, 41 KB: nav co 9 the loai (/sort/1_1/... /sort/9_1/)
// + form tim kiem POST /s.php (field "s").
// - Trang danh sach /sort/<id>_<page>/: 20 muc/trang, moi muc la
//.lastupdate ul li (span.lei the loai, span.name a ten + link
// /xiaoshuo/<id>/, span.jie chuong moi nhat, span.zuo tac gia,
// span.time ngay cap nhat). Khong co anh bia trong danh sach.
// Phan trang: div.page a.zhuan chu "下页" (vd "/sort/1_2/",
// trang cuoi khong co link 下页).
// - Ket qua tim kiem POST /s.php: cung cau truc.lastupdate ul li,
// khong phan trang. GET /s.php?s=... tra trang rong (khong doc
// query) nen bat buoc POST. POST co luc treo tu VM (2 lan dau
// tra 000, sau do 200) — co the la tarpit voi IP datacenter;
// test tren may that se quyet dinh giu hay bo search.js.
// - Chi tiet /xiaoshuo/<id>/: meta og:novel:* (ten, tac gia, the loai,
// trang thai 连载中/已完结, read_url /book/<id>/) +.border_left img
// bia (duong dan tuong doi) +.hang_3 gioi thieu +.hang_1
// (loai/trang thai). Muc luc day du tren 1 trang:.border_chapter
// ul li a (thien su than y: 4990 muc, thu tu tang dan ch.1 ->
// ch.5038, khong trung link).
// - Chuong /zhangjie/<id>/<chapterid>.html: noi dung o #txt, cac doan
// tach nhau bang <br> (khong co <p>), dau trang co 1 the <a> quang
// cao "一秒记住..." (chap.js xoa ca the <a> do).
// Khong thay dau hieu chia trang ("下一页") o ch.1; chap.js van
// xu ly phong thu link _2.html neu co. Chuong doc DU, KHONG can
// dang nhap, khong VIP, khong preview (kiem chung ch.1 天师神医:
// 2486 ky tu, mo dau "前往上京市的火车上，王欢坐在挨窗位置…").
// - Mirror m.dingdian666.com tra 200, cung duong dan /xiaoshuo/,
// /sort/, /zhangjie/ (kiem chung live 2026-11-15).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11),
// giai ma UTF-8 (site dung UTF-8, khong phai GBK). Duong chinh:
// pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi jitter,
// retry 429/405/503, tu ghi cooldown khi bi chan. Neu domain chinh
// loi mang/5xx thi thu lan luot cac mirror trong MIRROR_LIST
// (cung pacing). Tra ve { doc: Document} khi thanh cong, hoac
// { error: "tieng Viet"}.
function fetchDdDoc(url) {
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
return { error: rateLimitErrorMessage("顶点小说", pacedHostOf(candidates[i]), res.cooldownRemainingMs)};
}
if (!res.ok) {
var st = res.status || 0;
if (st === 429 || st === 405) {
return { error: rateLimitErrorMessage("顶点小说", pacedHostOf(candidates[i]), res.cooldownRemainingMs)};
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
doc = res.res.html();
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

// POST 1 form (tim kiem) co pacing, tra ve { doc} hoac { error}.
// Dung pacedFetch that (fetchPage bo qua method/body, chi gui GET).
function fetchDdPostDoc(url, body) {
var res = null;
try {
res = pacedFetch(url, {
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded"},
body: body
});
} catch (e) {
return { error: "Không tải được trang (lỗi mạng): " + url};
}
if (!res) return { error: "Không tải được trang: " + url};
if (res.error === "cooldown") {
return { error: rateLimitErrorMessage("顶点小说", pacedHostOf(url), res.cooldownRemainingMs)};
}
if (!res.ok) {
var st = res.status || 0;
if (st === 429 || st === 405) {
return { error: rateLimitErrorMessage("顶点小说", pacedHostOf(url), res.cooldownRemainingMs)};
}
return { error: "Không tải được trang (HTTP " + (st || "?") + "): " + url};
}
var doc = null;
try {
doc = res.res.html();
} catch (e2) {
return { error: "Không đọc được nội dung trang: " + url};
}
if (!doc) return { error: "Không đọc được nội dung trang: " + url};
return { doc: doc};
}

// Tach id truyen (so) tu URL dang /xiaoshuo/<id>/, /book/<id>/,
// /ebooks/<id>/, /zhangjie/<id>/... Tra "" neu khong tach duoc.
function bookId(url) {
var m = String(url || "").match(/(?:xiaoshuo\/|book\/|ebooks\/|zhangjie\/)(\d+)/i);
return m? m[1]: "";
}

// Parser 1 dong truyen trong.lastupdate ul li (trang danh sach /
// ket qua tim kiem). Cau truc that (kiem chung live 2026-11-15):
// span.lei > a "[the loai]"
// span.name > a[href="/xiaoshuo/<id>/"] ten truyen
// span.jie > a chuong moi nhat
// span.zuo > a tac gia
// span.time ngay cap nhat
// Danh sach khong co anh bia nen khong tra cover.
function parseBookRow(el) {
var titleEl = safeFirst(el.select(".name a"));
if (titleEl === null) return null;
var name = cleanText(titleEl.text());
if (!name) return null;
var link = absUrl(titleEl.attr("href"));
if (!link) return null;
if (link.slice(-1)!== "/") link = link + "/";
var author = "";
var zuoEl = safeFirst(el.select(".zuo"));
if (zuoEl!== null) author = cleanText(zuoEl.text());
var latest = "";
var jieEl = safeFirst(el.select(".jie"));
if (jieEl!== null) latest = cleanText(jieEl.text());
var cat = "";
var leiEl = safeFirst(el.select(".lei"));
if (leiEl!== null) cat = cleanText(leiEl.text()).replace(/[\[\]]/g, "");
var desc = author;
if (latest) desc = author? author + " — Mới: " + latest: "Mới: " + latest;
return {
name: name,
link: link,
description: desc,
tag: cat,
host: siteOrigin()
};
}

// Parser ca danh sach.lastupdate ul li: duyet cac dong, bo trung theo link.
function parseBookRows(doc) {
var items = [];
var seen = {};
var rows = doc.select(".lastupdate ul li");
var i = 0;
for (i = 0; i < rows.size(); i++) {
var item = parseBookRow(rows.get(i));
if (item &&!seen[item.link]) {
seen[item.link] = true;
items.push(item);
}
}
return items;
}
