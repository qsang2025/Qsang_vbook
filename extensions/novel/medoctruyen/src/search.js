// search.js — Tim kiem truyen tren Me Doc Truyen (medoctruyen.vn).
//
// Tim kiem HOAT DONG qua GET /browse?q=<tu khoa> (kiem chung live
// 2026-11-12: "tu tien" tra 10 ket qua/trang, tieu de khop tu khoa;
// tham so dung la q=, /browse?search= KHONG loc). Phan trang bang link
// "Tiep→" (token URL day du) hoac so trang "2" khi test tay.
// execute(query, page).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm.");

    var baseUrl = BASE_URL + "/browse?q=" + encodeURIComponent(query);
    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (page && !isNaN(parseInt(page, 10))) {
        url = withPageParam(baseUrl, page);
    } else {
        url = baseUrl;
    }

    var r = fetchMdDoc(url);
    if (r.error) return Response.error(r.error);

    var items = parseBookList(r.doc);
    if (items.length === 0) return Response.success([], "");
    var next = nextPageUrl(r.doc);
    return Response.success(items, next);
}
