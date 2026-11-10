// chap.js — Noi dung 1 chuong truyen SS Truyen (sstruyen.net).
//
// Trang chuong `/truyen/<slug>/chuong-N` (HTML tinh, kiem chung live
// 2026-11-10): noi dung sach trong `<div class="chapter-content">`,
// phan doan bang `<br />`, khong thay quang cao chen trong noi dung.
// Tieu de chuong lay tu `h1` dau tien (VD "Chương 1: Tranh chấp").
// Tra ve HTML noi dung + tieu de chuong (data2).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");

    var r = fetchSsDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var title = "";
    var h1 = doc.select("h1").first();
    if (h1 !== null) title = cleanText(h1.text());
    if (!title) {
        var og = doc.select("meta[property=og:title]").first();
        if (og !== null) title = cleanText((og.attr("content") || "").split(" | ")[0]);
    }

    var content = doc.select(".chapter-content").first();
    if (content === null) return Response.error("Không đọc được nội dung chương: " + chapUrl);
    content.select("script, style, iframe, ins, .ads, .quang-cao").remove();
    var html = content.html() || "";
    var text = cleanText(content.text());
    if (!html || text.length < 20) return Response.error("Nội dung chương trống: " + chapUrl);
    return Response.success(html, title);
}
