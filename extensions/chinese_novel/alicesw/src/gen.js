// gen.js — danh sach truyen cua mot the loai (/lists/N.html?page=N).
// Trang the loai khong co anh bia cho tung truyen (chi co ten + tac gia)
// nen item khong gui cover — khong dung anh placeholder.
// Phan trang: ?page=N, co nut 下一页 thi moi co trang sau.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    if (!page) page = "1";
    var target = BASE_URL + url + "?page=" + page;
    var response = fetchPage(target);
    if (!response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + response.status + ")");
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
        data.push({
            name: name,
            link: linkEl.attr("href"),
            description: authorEl ? authorEl.text() : "",
            host: BASE_URL
        });
    }
    var next = "";
    if (doc.select(".pager a:contains(下一页)").size() > 0) {
        next = (parseInt(page, 10) + 1).toString();
    }
    return Response.success(data, next);
}
