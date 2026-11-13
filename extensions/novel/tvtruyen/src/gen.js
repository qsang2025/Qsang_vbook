// gen.js — Danh sach truyen theo URL (tab trang chu / the loai / tac gia /
// nhom dich). Site dung .comic-card o trang chu va .info-mobile-card o
// trang the loai/tim kiem (45 muc/trang the loai); phan trang
// .custom-pagination-list ?page=N.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url, page) {
    if (!url) return Response.success([], "");
    if (!page) page = "1";

    var fetchUrl = buildPageUrl(normalizeUrl(url), page);
    var r = fetchTvPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = "";
    var nextUrl = detectNextPage(r.doc);
    if (nextUrl) next = extractPageToken(nextUrl, page);
    return Response.success(data, next);
}
