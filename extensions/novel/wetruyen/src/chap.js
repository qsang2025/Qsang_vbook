// chap.js — Noi dung 1 chuong truyen Wetruyen (wetruyen.com).
//
// Trang chuong `/<slug>/chuong-<n>.html` (HTML tinh, kiem chung live
// 2026-11-11): noi dung sach trong `<div id="chapter-c">`, phan doan bang
// `<br /><br />`, khong thay quang cao chen trong noi dung. Tag/nav nam
// ngoai #chapter-c nen khong can loc them. Tieu de chuong lay tu
// `h1 a.chapter-title` (VD "Chương 1"), du phong tu `<title>`.
// Tra ve HTML noi dung + tieu de chuong (data2).
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

    var r = fetchWtDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var title = "";
    var h1a = doc.select("h1 a.chapter-title").first();
    if (h1a !== null) title = stripBom(cleanText(h1a.text()));
    if (!title) {
        var t = doc.title() || "";
        title = stripBom(cleanText(t.split(" của truyện ")[0]));
    }

    var content = doc.select("#chapter-c").first();
    if (content === null) return Response.error("Không đọc được nội dung chương: " + chapUrl);
    content.select("script, style, iframe, ins, .ads, .quang-cao").remove();
    var html = content.html() || "";
    var text = cleanText(content.text());
    if (!html || text.length < 20) return Response.error("Nội dung chương trống: " + chapUrl);
    return Response.success(html, title);
}
