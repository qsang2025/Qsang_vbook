// page.js — Phan trang muc luc: muc luc chia 100 chuong/trang qua API.
// Tra ve mang URL tuyet doi cac trang muc luc; app goi toc.js tren tung URL.
// URL dang /story/<id>?toc_page=<n>&v=<versionId> (v de toc.js khoi phai
// goi lai translate-versions). Trang 1 luon co mat ke ca khi truyen 0 chuong.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var id = storyIdFromUrl(url);
    if (!id) return Response.error("Link truyện không hợp lệ");
    var rv = resolveVersionId(id);
    if (rv.error) return Response.error(rv.error);
    var versionId = rv.versionId;

    // Lay tong so trang voi limit=100 (metadata.total_pages phu thuoc limit).
    var rr = stvFetchJson(API_URL + "/api/chapters/" + versionId + "?page=1&limit=100&story_id=" + id + "&sort_order=asc");
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    var totalPages = 1;
    if (json && json.data && json.data.metadata && json.data.metadata.total_pages) {
        totalPages = parseInt(json.data.metadata.total_pages, 10) || 1;
    }
    if (totalPages < 1) totalPages = 1;

    var pages = [];
    for (var n = 1; n <= totalPages; n++) {
        pages.push(BASE_URL + "/story/" + id + "?toc_page=" + n + "&v=" + versionId);
    }
    return Response.success(pages);
}
