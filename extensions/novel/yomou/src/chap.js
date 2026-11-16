// chap.js — Noi dung 1 chuong tu HTML tinh (execute(url) -> html, tieu
// de chuong). Selector that (kiem chung live 2026-11-16, tu VM):
// div.p-novel__text — NHUNG phai loai bo khoi 前書き/後書き
// (class p-novel__text--preface / p-novel__text--afterword) vi do la
// loi tac gia, khong phai than bai. Selector #novel_honbun cua base
// khoa301020 v6 da CHET (0 lan xuat hien tren trang that).
// Tieu de lay tu .p-novel__subtitle-episode ("1 二度目の転生").
// Truyen ngan: URL chuong chinh la URL trang chi tiet — than bai nam
// ngay tren trang do trong cung div.p-novel__text.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeSyUrl(url);
    if (!chapUrl) return Response.error("Không có đường dẫn chương.");
    var r = fetchSyDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var subtitle = "";
    var subEl = safeFirst(doc.select(".p-novel__subtitle-episode"));
    if (subEl !== null) subtitle = cleanText(subEl.text());
    if (!subtitle) {
        var h1 = safeFirst(doc.select("h1"));
        if (h1 !== null) subtitle = cleanText(h1.text());
    }

    var bodyHtml = "";
    var blocks = doc.select("div.p-novel__text");
    for (var i = 0; i < blocks.size(); i++) {
        var b = blocks.get(i);
        var cls = "";
        try { cls = String(b.attr("class") || ""); } catch (e) { cls = ""; }
        if (cls.indexOf("preface") !== -1) continue;
        if (cls.indexOf("afterword") !== -1) continue;
        var h = "";
        try { h = String(b.html() || ""); } catch (e2) { h = ""; }
        if (h) { bodyHtml = h; break; }
    }
    if (!bodyHtml) return Response.error("Không đọc được nội dung chương.");
    var cleaned = cleanHtml(bodyHtml);
    var plain = stripTags(cleaned).replace(/\s+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương.");
    return Response.success(cleaned, subtitle);
}
