// page.js — Danh sach URL cac trang muc luc cua mot truyen.
// Goi API chapter_list trang 1 lay total_page (50 chuong/trang).
load("config.js");
load("rate-limit.js");

function execute(url) {
    var slug = storySlug(url);
    if (!slug) return Response.error("URL truyện không hợp lệ");

    var base = API_URL + "/v1/story/" + slug + "/chapter_list?new=0&page=";
    var rr = blhFetchJson(base + "1");
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.success) return Response.error("Không tải được danh sách chương");

    var total = parseInt(json.total_page, 10) || 1;
    var pages = [];
    for (var i = 1; i <= total; i++) {
        pages.push(base + i);
    }
    return Response.success(pages);
}
