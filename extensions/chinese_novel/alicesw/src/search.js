// search.js — tim kiem truyen tren alicesw.
// GET /search.html?q=<tu khoa da encode>&p=<trang> (10 ket qua/trang).
// Khong co ket qua thi tra danh sach rong (khong bao loi). Chi co trang
// sau khi trang ket qua co nut 下一页.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function parseSearchItems(doc) {
    var data = [];
    var elems = doc.select(".list-group .list-group-item");
    for (var i = 0; i < elems.size(); i++) {
        var e = elems.get(i);
        var linkEl = safeFirst(e.select("h5 a"));
        if (!linkEl) continue;
        var name = linkEl.text().replace(/^\d+\.\s*/, "").trim();
        var statusEl = safeFirst(e.select("h5 small"));
        var descEl = safeFirst(e.select("p.content-txt"));
        var desc = descEl ? descEl.text() : "";
        if (!desc) {
            var metaEl = safeFirst(e.select("p.mb-1"));
            if (metaEl) desc = metaEl.text();
        }
        data.push({
            name: name,
            link: linkEl.attr("href"),
            description: desc,
            tag: statusEl ? statusEl.text() : "",
            host: BASE_URL
        });
    }
    return data;
}

function execute(key, page) {
    if (!key) return Response.success([], "");
    if (!page) page = "1";
    var url = BASE_URL + "/search.html?q=" + encodeURIComponent(key) + "&p=" + page;
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tìm kiếm được (HTTP " + response.status + ")");
    var doc = response.html();
    var data = parseSearchItems(doc);
    var next = "";
    if (doc.select(".pages a:contains(下一页)").size() > 0 && data.length > 0) {
        next = (parseInt(page, 10) + 1).toString();
    }
    return Response.success(data, next);
}
