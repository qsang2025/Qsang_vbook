// gen.js — Danh sach truyen theo URL archive (tab trang chu / the loai /
// tac gia / suggest). The truyen: .uk-cover-container (28 muc/trang o
// archive the loai, kiem chung 2026-11-14: ngon-tinh p1 28 muc, p2 28
// muc khac, 0 trung). Phan trang /page/N/ qua a.next.page-numbers.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url, page) {
    if (!url) return Response.success([], "");
    if (!page) page = "1";

    var fetchUrl = buildArchivePageUrl(normalizeUrl(url), page);
    var r = fetchVivuPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = detectNextPageToken(r.doc, page);
    return Response.success(data, next);
}
