// chap.js — Noi dung 1 chuong truyen QuanBen.
//
// Trang chuong `/n/<slug>/<n>.html` (HTML tinh, kiem chung live 2026-11-12):
// noi dung sach trong `<div id="content">` (cac doan <p>); doan <p> dau
// tien la tieu de chuong (VD "第1章 地狱灵芝"); co <span id="ad"> quang
// cao o dau can bo. Tieu de chuong tra ve qua data2.
// Trang chuong khong co phan trang (1 URL = 1 chuong day du).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");

    var r = fetchQBDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var content = safeFirst(doc.select("#content"));
    if (content === null) return Response.error("Không đọc được nội dung chương: " + chapUrl);
    content.select("script, style, iframe, ins, #ad, .ads").remove();

    var title = "";
    var firstP = safeFirst(content.select("p"));
    if (firstP !== null) title = cleanText(firstP.text());
    if (!title) {
        var t = doc.title() || "";
        title = cleanText(t.split(" - ")[0]);
    }

    var html = content.html() || "";
    var text = cleanText(content.text());
    if (!html || text.length < 20) return Response.error("Nội dung chương trống: " + chapUrl);
    return Response.success(html, title);
}
