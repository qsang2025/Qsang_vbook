// gen.js — Danh sach truyen theo tab trang chu / the loai (co phan trang).
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    rateLimitDelay("quykhu.com");
    var response = request(url, { queries: { page: page || "1" } });
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");
    return parseCards(response.html());
}
