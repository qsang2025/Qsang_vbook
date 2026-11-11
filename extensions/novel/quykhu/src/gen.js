load("config.js");

function execute(url, page) {
    url = normalizeUrl(url);
    var p = page ? String(page) : "1";
    var response = request(url, { queries: { page: p } });
    if (!response || !response.ok) {
        var status = response ? response.status : 0;
        return Response.error("Không thể tải danh sách truyện (HTTP " + status + ")");
    }
    return parseCards(response.html());
}
