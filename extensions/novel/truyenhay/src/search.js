// search.js — Tim kiem Truyen Hay (truyenhay.com).
//
// Tim theo tieu de qua WP REST API (search_columns=post_title).
// Site tra ket qua ca khi go co dau va khong dau (kiem chung live
// 2026-11-14: "tui phan" ra 42 ket qua, "vo mat" ra 13 ket qua).
// 50 bai/trang, gop cac ky cua cung truyen thanh 1 muc.
// execute(query, page).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm truyện");

    var response = fetchPosts({
        search: query,
        search_columns: "post_title",
        per_page: "50",
        page: page,
        _fields: "id,link,title,excerpt,date,featured_media"
    });
    if (!response.ok) return Response.error("Không tìm kiếm được (HTTP " + response.status + ")");
    var items = groupPosts(response.json());
    fetchCovers(items);
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, nextToken(response, page));
}
