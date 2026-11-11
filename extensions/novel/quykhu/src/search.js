load("config.js");

function execute(key, page) {
    var p = page ? String(page) : "1";
    var response = request(BASE_URL + "/search", {
        queries: { keyword: key, page: p }
    });
    if (!response || !response.ok) {
        var status = response ? response.status : 0;
        return Response.error("Không thể tìm kiếm truyện (HTTP " + status + ")");
    }
    return parseCards(response.html());
}
