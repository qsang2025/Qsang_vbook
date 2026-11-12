// suggest1.js — danh sach truyen theo tag (/search?q=<tag>&f=tag).
// Input la URL day du do detail.js truyen (BASE_URL + href cua tag).
// Cung markup ket qua nhu search.js, phan trang bang &p=.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(key, page) {
    if (!key) return Response.success([], "");
    if (!page) page = "1";
    // Tag co the chua chu Trung chua encode (vd. q=妈妈) — encode lai
    // phan gia tri cua q de fetch khong loi.
    key = key.replace(/([?&]q=)([^&]*)/, function (m, prefix, value) {
        try {
            return prefix + encodeURIComponent(decodeURIComponent(value));
        } catch (e) {
            return prefix + encodeURIComponent(value);
        }
    });
    var response = fetchPage(key + "&p=" + page);
    if (!response.ok) return Response.error("Không tải được danh sách tag (HTTP " + response.status + ")");
    var doc = response.html();
    var data = [];
    var elems = doc.select(".list-group .list-group-item");
    for (var i = 0; i < elems.size(); i++) {
        var e = elems.get(i);
        var linkEl = safeFirst(e.select("h5 a"));
        if (!linkEl) continue;
        var name = linkEl.text().replace(/^\d+\.\s*/, "").trim();
        var statusEl = safeFirst(e.select("h5 small"));
        var descEl = safeFirst(e.select("p.content-txt"));
        data.push({
            name: name,
            link: linkEl.attr("href"),
            description: descEl ? descEl.text() : "",
            tag: statusEl ? statusEl.text() : "",
            host: BASE_URL
        });
    }
    var next = "";
    if (doc.select(".pages a:contains(下一页)").size() > 0 && data.length > 0) {
        next = (parseInt(page, 10) + 1).toString();
    }
    return Response.success(data, next);
}
