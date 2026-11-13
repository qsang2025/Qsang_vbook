// search.js — Tim kiem: GET /truyen?keyword=<tu khoa>&page=N.
// Form tim kiem cua site day ve /truyen?keyword=... (route /tim-kiem
// khong tra ket qua — kiem chung 2026-11-13). Ket qua dung layout the
// truyen nhu trang danh sach (24 muc/trang).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    var keyword = query;
    if (typeof query === "object" && query !== null && query.length !== undefined) {
        keyword = query[0];
        page = query[1];
    }
    if (!keyword) return Response.success([], "");
    if (!page) page = "1";

    var key = String(keyword).trim();
    if (!key) return Response.success([], "");
    var fetchUrl = BASE_URL + "/truyen?keyword=" + encodeURIComponent(key) + "&page=" + encodeURIComponent(String(page));
    var r = fetchTtvPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = "";
    var nextUrl = detectNextPage(r.doc, fetchUrl);
    if (nextUrl) next = extractPageToken(nextUrl, page);
    return Response.success(data, next);
}
