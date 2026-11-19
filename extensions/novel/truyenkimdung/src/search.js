// search.js — Tim kiem truyen tren Truyen Kim Dung (truyenkimdung.net).
//
// Tim kiem HOAT DONG qua GET /?q=<tu khoa> (SearchAction cua site, SSR —
// kiem chung live 2026-11-19: "Bich Huyet" tra dung 1 ket qua). Thu vien
// chi 20 bo nen lay pageSize=20 de gom het ket qua trong 1 trang; van giu
// token trang sau (link "Sau") neu site tang so luong. execute(query, page).
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

    var baseUrl = BASE_URL + "/?q=" + encodeURIComponent(query) + "&pageSize=20";
    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (page && !isNaN(parseInt(page, 10))) {
        url = withPageParam(baseUrl, page);
    } else {
        url = baseUrl;
    }

    var r = fetchTkDoc(url);
    if (r.error) return Response.error(r.error);

    var items = parseBookList(r.doc);
    if (items.length === 0) return Response.success([], "");
    var next = nextPageUrl(r.doc);
    return Response.success(items, next);
}
