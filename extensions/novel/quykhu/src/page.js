load("config.js");

function execute(url) {
    url = normalizeUrl(url);
    var qIdx = url.indexOf("?");
    if (qIdx !== -1) {
        url = url.substring(0, qIdx);
    }
    var doc = fetchHtml(url);
    if (!doc) return Response.error("Không thể tải thông tin trang mục lục từ " + url);

    var endpoint = chapterEndpoint(doc);
    if (!endpoint) return Response.error("Không tìm thấy danh sách chương cho truyện này");

    var csrf = saveCsrf(doc);
    var response = postChapters(endpoint, 1, csrf);
    if (!response || !response.ok) {
        var status = response ? response.status : 0;
        return Response.error("Không thể tải danh sách chương ban đầu (HTTP " + status + ")");
    }

    var json = response.json();
    var data = [endpoint + "?page=1"];
    var lastPage = json ? (json.lastPage || 1) : 1;
    if (lastPage <= 1) return Response.success(data);

    var links = chapterLinks(json.html);
    var first = links.size() ? links.get(0).attr("href") : "";
    var size = links.size();
    if (!/\d+(\.html)?$/.test(first)) return Response.success(data);

    var tpl = first.replace(/\d+(\.html)?$/, "{n}$1");
    var total = json.total || (lastPage * size);
    for (var i = 2; i <= lastPage; i++) {
        data.push(endpoint + "?page=" + i + "&size=" + size + "&total=" + total + "&tpl=" + encodeURIComponent(tpl));
    }
    return Response.success(data);
}
