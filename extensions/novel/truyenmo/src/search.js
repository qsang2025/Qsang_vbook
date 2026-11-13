// search.js — Tim kiem: GET /tim-kiem?search=<kw> (kiem chung
// 2026-11-13: "am ve" tra 1 ket qua). Ket qua dung layout card
// .row.product-grid (24/trang, phan trang ?page=N).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(keyword, page) {
    page = page || '1';
    keyword = String(keyword || '').trim();
    if (!keyword) return Response.success([], '');

    var searchUrl = BASE_URL + '/tim-kiem?search=' + encodeURIComponent(keyword).replace(/%20/g, '+');
    searchUrl = buildPageUrl(searchUrl, page);

    var r = fetchTruyenmoPage(searchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (!data.length) return Response.success([], '');

    var nextUrl = detectNextPage(r.doc, searchUrl);
    var next = '';
    if (nextUrl) next = extractPageToken(nextUrl, page);

    return Response.success(data, next);
}
