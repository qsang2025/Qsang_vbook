// gen1.js — bang xep hang cua alicesw (/other/rank_hits/order/*.html).
// Cung markup .txt-list nhu gen.js nhung trang rank chi co 1 trang
// (tab trang chu khong phan trang) nen khong co next token.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    var response = fetchPage(BASE_URL + url);
    if (!response.ok) return Response.error("Không tải được bảng xếp hạng (HTTP " + response.status + ")");
    var doc = response.html();
    var data = [];
    var items = doc.select(".txt-list li");
    for (var i = 0; i < items.size(); i++) {
        var e = items.get(i);
        var linkEl = safeFirst(e.select(".s2 a"));
        if (!linkEl) continue;
        var name = linkEl.text();
        var tagEl = safeFirst(e.select(".fenleibt"));
        if (tagEl) name = name.replace(tagEl.text(), "").trim();
        var authorEl = safeFirst(e.select(".s5"));
        var desc = authorEl ? authorEl.text() : "";
        var hitsEl = safeFirst(e.select(".five"));
        if (hitsEl && hitsEl.text()) desc = desc + " " + hitsEl.text();
        data.push({
            name: name,
            link: linkEl.attr("href"),
            description: desc,
            host: BASE_URL
        });
    }
    return Response.success(data);
}
