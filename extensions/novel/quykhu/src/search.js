// search.js — Tim kiem theo tu khoa (GET /search?keyword=...&page=...).
load("config.js");
load("rate-limit.js");

function execute(key, page) {
    rateLimitDelay("quykhu.com");
    var response = request(BASE_URL + "/search", {
        queries: { keyword: key, page: page || "1" }
    });
    if (!response.ok) return Response.error("Không tìm được truyện (HTTP " + response.status + ")");
    return parseCards(response.html());
}
