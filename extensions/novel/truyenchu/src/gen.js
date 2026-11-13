// gen.js — Danh sach truyen theo URL archive (tab trang chu / the loai /
// tac gia). The truyen: .page-item-detail (22 muc/trang).
// Phan trang /page/N/ qua a.next.page-numbers.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url, page) {
    if (!url) return Response.success([], "");
    if (!page) page = "1";

    var fetchUrl = buildArchivePageUrl(normalizeUrl(url), page);
    var r = fetchTruyenchuPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = detectNextPageToken(r.doc);
    return Response.success(data, next);
}
