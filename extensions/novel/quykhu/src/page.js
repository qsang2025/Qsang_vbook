// page.js — Trang muc luc: tra danh sach URL cac trang muc luc.
// Trang 1 lay that tu API; cac trang sau sinh tu mau link trang 1
// (endpoint gioi han ~20 request/phut) thay vi fetch tung trang.
load("config.js");
load("rate-limit.js");

function execute(url) {
    rateLimitDelay("quykhu.com");
    var doc = fetchHtml(normalizeUrl(url).split("?")[0]);
    if (!doc) return Response.error("Không tải được trang truyện");
    var endpoint = chapterEndpoint(doc);
    if (!endpoint) return Response.error("Không tìm thấy danh sách chương");
    var token = saveCsrf(doc);
    if (!token) return Response.error("Không lấy được mã phiên (CSRF) từ trang truyện");
    var response = postChapters(endpoint, 1, token);
    if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
    var json = null;
    try { json = response.json(); } catch (e) {}
    if (!json) return Response.error("Máy chủ không trả danh sách chương");
    var data = [endpoint + "?page=1"];
    if (json.lastPage <= 1) return Response.success(data);
    var links = chapterLinks(json.html);
    var first = links.size() ? links.get(0).attr("href") : "";
    var size = links.size();
    if (!/\d+(\.html)?$/.test(first)) return Response.success(data);
    var tpl = first.replace(/\d+(\.html)?$/, "{n}$1");
    for (var i = 2; i <= json.lastPage; i++) {
        data.push(endpoint + "?page=" + i + "&size=" + size + "&total=" + json.total + "&tpl=" + encodeURIComponent(tpl));
    }
    return Response.success(data);
}
