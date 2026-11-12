// chap.js — Noi dung 1 chuong truyen Truyen4u.
//
// Trang chuong `/<slug>-<id>/chuong-<n>-<tieu-de>-<id>/` hoac
// `/<slug>-<id>/part-<n>-<id>/` hoac `/<slug>-<id>/<slug-tu-do>-<id>/`
// (HTML tinh, kiem chung live 2026-11-12):
// noi dung sach trong `<div class="chapter-content">` (cac doan <p>);
// tieu de chuong o `h2.chapter-title` — chinh the h2 nay mang
// id="chapter" (khong phai div noi dung; dung nham selector se lay
// nham tieu de thay cho noi dung), du phong tu <title> (phan sau dau
// " - " cuoi cung). Tra ve HTML noi dung + tieu de chuong (data2).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    // App cat dau "/" cuoi cua URL arg khi chay that; site dung URL co "/".
    if (chapUrl.charAt(chapUrl.length - 1) !== "/") chapUrl = chapUrl + "/";

    var r = fetchT4Doc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var title = "";
    var h2 = doc.select("h2.chapter-title").first();
    if (h2 !== null) title = cleanText(h2.text());
    if (!title) {
        var t = doc.title() || "";
        var parts = t.split(" - ");
        title = cleanText(parts[parts.length - 1] || t);
    }

    var content = doc.select(".chapter-content").first();
    if (content === null) return Response.error("Không đọc được nội dung chương: " + chapUrl);
    content.select("script, style, iframe, ins, .ads, .quang-cao").remove();
    var html = content.html() || "";
    var text = cleanText(content.text());
    if (!html || text.length < 20) return Response.error("Nội dung chương trống: " + chapUrl);
    return Response.success(html, title);
}
