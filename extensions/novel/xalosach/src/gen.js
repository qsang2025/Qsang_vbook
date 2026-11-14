// gen.js — Danh sach truyen dung chung cho tab trang chu + the loai.
// Input: URL danh sach (duong dan tuong doi hoac day du) + page (so
// trang, dang chuoi; rong = trang 1).
// Phan trang cua site (kiem chung 2026-11-14 — tham so ?page=N BI BO
// QUA, trang 2 tra giong het trang 1):
// - Danh sach: /danhsach/P{N}/index.html?status=..&sort=..
// - The loai:  /the-loai/P{N}/<slug>.html?status=-1&sort=0
// Moi trang 50 truyen (li.story_item). Token trang sau chi tra khi
// pager cua trang hien tai co link sang dung trang ke tiep.

load("config.js");
load("rate-limit.js");

function pageUrl(input, page) {
    var p = parseInt(page, 10);
    if (!p || p <= 1) return input;
    if (input.indexOf("/danhsach/") !== -1) {
        var m1 = input.match(/^(.*\/danhsach\/)(P\d+\/)?(.*)$/);
        if (m1) return m1[1] + "P" + p + "/" + m1[3];
    }
    if (input.indexOf("/the-loai/") !== -1) {
        var m2 = input.match(/^(.*\/the-loai\/)(P\d+\/)?(.*)$/);
        if (m2) return m2[1] + "P" + p + "/" + m2[3];
    }
    return input;
}

function hasNextPage(htmlText, input, page) {
    var next = parseInt(page, 10) + 1;
    if (input.indexOf("/danhsach/") !== -1) {
        return htmlText.indexOf("/danhsach/P" + next + "/index.html") !== -1;
    }
    if (input.indexOf("/the-loai/") !== -1) {
        return htmlText.indexOf("/the-loai/P" + next + "/") !== -1;
    }
    return false;
}

function execute(input, page) {
    if (!page) page = "1";
    var url = input;
    if (url.indexOf("http") !== 0) url = absUrl(url);
    url = pageUrl(url, page);
    var t = xlsFetchText(url, BASE_URL + "/");
    if (t.error) return Response.error(t.error);
    var doc = Html.parse(t.text);
    var els = doc.select("li.story_item");
    var list = [];
    for (var i = 0; i < els.size(); i++) {
        var e = els.get(i);
        var linkEl = selFirst(e, "a.story_title");
        if (!linkEl) continue;
        var link = absUrl(linkEl.attr("href"));
        var name = cleanText(linkEl.text());
        if (!link || !name) continue;
        var cover = "";
        var imgEl = selFirst(e, "a.story_img");
        if (imgEl) {
            var style = imgEl.attr("style") || "";
            var m = style.match(/url\(['"]?([^'")]+)['"]?\)/);
            if (m) cover = absUrl(m[1]);
        }
        var descEl = selFirst(e, ".lst_5last .linkchap");
        list.push({
            name: name,
            link: link,
            host: BASE_URL,
            cover: cover,
            description: descEl ? cleanText(descEl.text()) : ""
        });
    }
    if (list.length === 0) return Response.success([], "");
    var next = "";
    if (hasNextPage(t.text, url, page)) {
        next = String(parseInt(page, 10) + 1);
    }
    return Response.success(list, next);
}
