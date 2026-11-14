// homecontent.js — Danh sach truyen trang chu (6 khoi .cover-list).
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var rr = ttlFetchDoc(BASE_URL + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var list = [];
    var items = doc.select(".cover-list li");
    for (var i = 0; i < items.size(); i++) {
        var el = items.get(i);
        var linkEl = selFirst(el, "h4 a");
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
    if (list.length === 0) return Response.error("Không đọc được danh sách truyện trang chủ: " + BASE_URL + "/");
    return Response.success(list, "");
}
