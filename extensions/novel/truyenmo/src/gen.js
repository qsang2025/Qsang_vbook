// gen.js — Trang danh sach truyen (trang chu, /truyen-moi.html,
// /truyen-hoan-thanh.html, /the-loai/<slug>.html). 24 truyen/trang,
// phan trang ?page=N.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url, page) {
    page = page || '1';
    url = buildPageUrl(url, page);

    var r = fetchTruyenmoPage(url);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (!data.length) return Response.success([], '');

    var nextUrl = detectNextPage(r.doc, url);
    var next = '';
    if (nextUrl) next = extractPageToken(nextUrl, page);

    return Response.success(data, next);
}
