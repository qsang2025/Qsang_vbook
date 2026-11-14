// genrecontent.js — Danh sach truyen theo the loai.
// URL dang {the-loai}/clickcount_days_7/{page}.html, 30 truyen/trang.
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    if (!page) page = "1";
    var base = String(url || "").replace(/\/+$/, "");
    if (!base) return Response.error("Link thể loại không hợp lệ");
    var rr = ttlFetchDoc(base + "/clickcount_days_7/" + page + ".html", base + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var list = [];
    var items = doc.select(".booklist li");
    for (var i = 0; i < items.size(); i++) {
        var el = items.get(i);
        var linkEl = selFirst(el, "h3 a");
        var link = linkEl ? normalizeUrl(linkEl.attr("href") || "") : "";
        var name = linkEl ? cleanText(linkEl.text()) : "";
        var imgEl = selFirst(el, "img");
        var cover = imgEl ? normalizeUrl(imgEl.attr("src") || "") : "";
        var descEl = selFirst(el, ".text-lightgrey");
        var desc = descEl ? cleanText(descEl.text()) : "";
        if (link && name) {
            list.push({ name: name, link: link, host: BASE_URL, cover: cover, description: desc });
        }
    }
    if (list.length === 0) return Response.error("Không đọc được danh sách truyện: " + base + "/clickcount_days_7/" + page + ".html");

    var next = "";
    var nextEl = selFirst(doc, ".pagination .active + a");
    if (nextEl) {
        var t = cleanText(nextEl.text());
        if (t && /^[0-9]+$/.test(t)) next = t;
    }
    return Response.success(list, next);
}
