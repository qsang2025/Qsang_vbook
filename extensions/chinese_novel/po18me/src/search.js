// search.js — list script dung chung cho tab trang chu, the loai va tim kiem:
// "rank:<0-3>" bang xep hang ngay / tuan / thang / tong (trang chu #ct)
// "home" truyen moi nhat tu trang chu (.last_li)
// "/wapsort/<n>_<p>.html" hoac URL tuyet doi trang the loai (phan trang)
// bat ky chuoi nao khac tim kiem tu khoa (POST /s.php)
// Kiem chung live 2026-11-16: rank 4 tab trong #ct > div; the loai
// 20 sach/trang (.common-bookele) + link #page .next; tim kiem POST /s.php
// tra cung bo cuc.common-bookele (tu "寄生" tra 14 muc, muc dau la 寄生).
// Site khong co cover that nen cover de rong.
// LUU Y: dung vong lap chi so size()/get() thay cho forEach tren Elements
// (runtime that co forEach nhung harness VM mo phong bang cheerio khong co).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(query, page) {
query = String(query === undefined || query === null? "": query);
page = String(page === undefined || page === null || page === ""? "1": page);

if (query.indexOf("rank:") === 0) {
return Response.success(rankList(parseInt(query.substring(5), 10)), "");
}
if (query === "home") {
return Response.success(latestList(), "");
}
if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
return browse(query, page);
}
return keywordSearch(query);
}

// Cat the loai trong cap ngoac lenticular tu text cua muc;
// thay cho ky tu that (ghi truc tiep hay bi pipeline cat mat).
// tra rong neu khong co. Dung String.fromCharCode(12304/12305)
function bracketGenre(text) {
var t = String(text === undefined || text === null ? "" : text);
var a = t.indexOf(String.fromCharCode(12304));
if (a === -1) return "";
var b = t.indexOf(String.fromCharCode(12305), a + 1);
if (b === -1) return "";
return t.substring(a + 1, b);
}

function rankList(index) {
if (isNaN(index) || index < 0) index = 0;

var r = fetchPoDoc(BASE_URL);
if (r.error) return [];
var doc = r.doc;

var tabs = doc.select("#ct > div");
if (tabs.size() === 0) return [];
var tab = tabs.get(Math.min(index, tabs.size() - 1));

var seen = {};
var items = [];
var lis = tab.select("li");
for (var i = 0; i < lis.size(); i++) {
var el = lis.get(i);
var linkEl = safeFirst(el.select("a[href]"));
if (linkEl === null) continue;
var name = cleanText(linkEl.text());
var href = absUrl(linkEl.attr("href"));
if (!name ||!href || seen[href]) continue;
seen[href] = true;

var genre = bracketGenre(el.text());
items.push({
name: name,
cover: "",
link: href,
description: genre,
tag: genre
});
}

return items;
}

function latestList() {
var r = fetchPoDoc(BASE_URL);
if (r.error) return [];
var doc = r.doc;

var items = [];
var rows = doc.select(".last_li");
for (var i = 0; i < rows.size(); i++) {
var el = rows.get(i);
var linkEl = safeFirst(el.select("a.name"));
if (linkEl === null) continue;

var name = cleanText(linkEl.text());
var href = absUrl(linkEl.attr("href"));
if (!name ||!href) continue;

var author = cleanText(el.select(".author").text());
var words = el.select(".words");
var genre = words.size() > 0? cleanText(words.get(0).text()).replace(/^类型[：:]\s*/, ""): "";
var time = cleanText(el.select(".words time").text());

var info = [];
if (author) info.push("作者：" + author);
if (genre) info.push("类型：" + genre);
if (time) info.push("时间：" + time);

items.push({
name: name,
cover: "",
link: href,
description: info.join(" · "),
tag: genre
});
}

return items;
}

function browse(query, page) {
var url = query.indexOf("http") === 0? normalizeUrl(query): BASE_URL + query;
if (page!== "1") {
url = url.replace(/_([0-9]+)\.html/, "_" + page + ".html");
}

var r = fetchPoDoc(url);
if (r.error) return Response.error(r.error);
var doc = r.doc;

var items = [];
var rows = doc.select(".common-bookele");
for (var i = 0; i < rows.size(); i++) {
var el = rows.get(i);
var linkEl = safeFirst(el.select("h3 a[href]"));
if (linkEl === null) continue;

var name = cleanText(linkEl.text());
var href = absUrl(linkEl.attr("href"));
if (!name ||!href) continue;

var author = cleanText(el.select("p strong").text());
var time = cleanText(el.select(".lastupdate time").text());

var info = [];
if (author) info.push("作者：" + author);
if (time) info.push("更新：" + time);

items.push({
name: name,
cover: "",
link: href,
description: info.join(" · ")
});
}

var current = parseInt(page, 10);
if (isNaN(current)) current = 1;
var nextUrl = doc.select("#page .next").attr("href");
var nextMatch = /_([0-9]+)\.html/.exec(nextUrl);
var nextPage = nextMatch && parseInt(nextMatch[1], 10) > current? String(parseInt(nextMatch[1], 10)): "";

return Response.success(items, nextPage);
}

function keywordSearch(query) {
query = cleanText(query);
if (!query) return Response.success([], "");

var r = null;
try {
r = pacedFetch(BASE_URL + "/s.php", {
method: "POST",
headers: {
"Content-Type": "application/x-www-form-urlencoded",
"Referer": BASE_URL + "/"
},
body: "type=articlename&s=" + encodeURIComponent(query)
});
} catch (e) {
return Response.error("Không tìm kiếm được (lỗi mạng).");
}
if (!r) return Response.error("Không tìm kiếm được.");
if (r.error === "cooldown") {
return Response.error(rateLimitErrorMessage("PO18", pacedHostOf(BASE_URL + "/s.php"), r.cooldownRemainingMs));
}
if (!r.ok) {
var st = r.status || 0;
if (st === 429 || st === 405) {
return Response.error(rateLimitErrorMessage("PO18", pacedHostOf(BASE_URL + "/s.php"), r.cooldownRemainingMs));
}
if (st) return Response.error("Tìm kiếm thất bại (HTTP " + st + ").");
return Response.error("Tìm kiếm thất bại (lỗi mạng).");
}
var doc = null;
try {
doc = docFromResponse(r.res, BASE_URL + "/s.php");
} catch (e2) {
return Response.error("Không đọc được kết quả tìm kiếm.");
}
if (!doc) return Response.error("Không đọc được kết quả tìm kiếm.");

var items = [];
var rows = doc.select(".common-bookele");
for (var i = 0; i < rows.size(); i++) {
var el = rows.get(i);
var linkEl = safeFirst(el.select("a.articlename"));
if (linkEl === null) continue;

var name = cleanText(linkEl.text());
var href = absUrl(linkEl.attr("href"));
if (!name ||!href) continue;

var author = cleanText(el.select("p strong").text());
var genre = cleanText(el.select(".lastupdate").text()).replace(/^栏目[：:]\s*/, "");

var info = [];
if (author) info.push("作者：" + author);
if (genre) info.push("栏目：" + genre);

items.push({
name: name,
cover: "",
link: href,
description: info.join(" · "),
tag: genre
});
}

return Response.success(items, "");
}
