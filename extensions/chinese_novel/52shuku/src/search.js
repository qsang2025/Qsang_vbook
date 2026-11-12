// search.js — Tim kiem truyen tren 52书库 (52shuku.net).
//
// Tim kiem HOAT DONG qua GET /so/search.php?q=<tu khoa> (kiem chung live
// 2026-11-13: "裂天空骑" tra 1 ket qua dung, "重生" tra 20 ket qua).
// Tham so page=2 tra giong het trang 1 (site khong phan trang ket qua)
// nen luon tra data2 = "". Ten ket qua co the mang tien to so thu tu
// ("1. 重生集合营_穆烟") — cat bo. Link ket qua co 2 dang
// (/<cat>/<NN>_b/<hash>.html va dang rut gon /<cat>/<hash>.html), ca 2
// deu mo truc tiep duoc. execute(query, page).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
query = query || "";
if (!query) return Response.error("Nhập từ khóa để tìm kiếm.");

var url = BASE_URL + "/so/search.php?q=" + encodeURIComponent(query);
var r = fetch52Doc(url);
if (r.error) return Response.error(r.error);

var items = parseBookList(r.doc);
var i = 0;
for (i = 0; i < items.length; i++) {
items[i].name = items[i].name.replace(/^\d+\.\s*/, "");
}
if (items.length === 0) return Response.success([], "");
return Response.success(items, "");
}
