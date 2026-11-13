// gen.js — Danh sach truyen theo URL (tab trang chu / the loai / tac gia).
// The truyen: div.flex.items-start.gap-2 (24 muc/trang). Phan trang
// ?page=N qua a[aria-label="Next page"].
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url, page) {
    if (!url) return Response.success([], "");
    if (!page) page = "1";

    var fetchUrl = buildPageUrl(normalizeUrl(url), page);
    var r = fetchTtvPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = "";
    var nextUrl = detectNextPage(r.doc, fetchUrl);
    if (nextUrl) next = extractPageToken(nextUrl, page);
    return Response.success(data, next);
}
