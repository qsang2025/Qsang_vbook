// gen.js — Trang danh sach Truyen Hay (truyenhay.com).
//
// Dung chung cho tab trang chu (home.js) va the loai (genre.js):
// input "" la tat ca bai moi nhat, so la id chuyen muc, chu la slug
// chuyen muc (detail.js tra genres theo slug). 50 bai/trang, gop cac ky
// cua cung truyen thanh 1 muc (xem groupPosts trong config.js), anh bia
// lay gom 1 cuoc goi /media (xem fetchCovers).
// execute(input, page).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(input, page) {
    input = input || "";
    page = page || "1";

    var queries = { per_page: "50", page: page, _fields: "id,link,title,excerpt,date,featured_media" };
    if (input) {
        var category = input;
        if (!/^\d+$/.test(category)) {
            rateLimitDelay("truyenhay.com");
            var lookup = fetch(API_URL + "/categories", { queries: { slug: category, _fields: "id" } });
            if (!lookup.ok) return Response.error("Không tải được chuyên mục (HTTP " + lookup.status + ")");
            var found = lookup.json();
            if (!found || !found.length) return Response.error("Không tìm thấy chuyên mục");
            category = String(found[0].id);
        }
        queries.categories = category;
    }

    var response = fetchPosts(queries);
    if (!response.ok) return Response.error("Không tải được danh sách truyện (HTTP " + response.status + ")");
    var items = groupPosts(response.json());
    fetchCovers(items);
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, nextToken(response, page));
}
