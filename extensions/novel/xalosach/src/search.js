// search.js — Tim kiem Xa Lo Sach (xalosach.com).
// Site tim theo slug khong dau: /<slug>/tim-kiem.html?page=N.
// Ket qua tra het trong 1 trang (khong co phan trang — kiem chung:
// ?page=2 tra giong het trang 1), nen token trang sau luon rong.

load("config.js");
load("rate-limit.js");
load("helper.js");

function execute(key, page) {
    if (!key || cleanText(key) === "") return Response.error("Nhập từ khóa để tìm truyện.");
    if (!page) page = "1";
    var url = BASE_URL + "/" + slugify(key) + "/tim-kiem.html?page=" + page;
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
    return Response.success(list, "");
}
