// toc.js — Muc luc 1 trang tu HTML tinh trang chi tiet ncode
// (execute(url) -> [{name, url}]). Moi trang 100 chuong (?p=N);
// page.js tra danh sach cac trang muc luc, app goi toc.js tung trang.
// Selector that (kiem chung live 2026-11-16, tu VM):
//.p-eplist__sublist > a.p-eplist__subtitle, text dang "1 二度目の転生".
// Selector.novel_sublist2 cua base khoa301020 v6 da CHET (0 lan xuat
// hien tren trang that).
// Truyen ngan (novel_type 2): khong co muc luc — tra 1 muc duy nhat
// tro ve chinh trang chi tiet (toan van nam o do).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
var detailUrl = normalizeSyUrl(url);
if (!detailUrl) return Response.error("Không có đường dẫn truyện.");
var r = fetchSyDoc(detailUrl);
if (r.error) return Response.error(r.error);
var doc = r.doc;

var chapters = [];
var groupName = "";
var rows = doc.select(".p-eplist__sublist,.p-eplist__chapter");
for (var i = 0; i < rows.size(); i++) {
var row = rows.get(i);
var cls = "";
try { cls = String(row.attr("class") || "");} catch (e) { cls = "";}
if (cls.indexOf("p-eplist__chapter")!== -1) {
groupName = cleanText(row.text());
continue;
}
var a = safeFirst(row.select("a.p-eplist__subtitle"));
if (a === null) a = safeFirst(row.select("a"));
if (a === null) continue;
var href = String(a.attr("href") || "");
if (!href) continue;
var name = cleanText(a.text());
if (!name) continue;
if (groupName) name = "" + name;
chapters.push({ name: name, url: normalizeSyUrl(href)});
}
if (chapters.length > 0) return Response.success(chapters);

// Khong co muc luc: co the la truyen ngan — xac nhan qua API
// (novel_type 2) roi tra 1 muc tro ve trang chi tiet.
var ncode = extractNcode(detailUrl);
if (ncode) {
var jr = fetchSyJson(queryBuilder({ ncode: ncode, of: "t-n-nt-ga"}));
if (!jr.error && jr.json && jr.json.length >= 2 && jr.json[1] && jr.json[1].noveltype === 2) {
var title = "";
var h1 = safeFirst(doc.select("h1"));
if (h1!== null) title = cleanText(h1.text());
if (!title) title = String(jr.json[1].title || "");
return Response.success([{ name: "「短編」・" + htmlDecode(title), url: detailUrl}]);
}
}
return Response.error("Không đọc được mục lục.");
}
