// gen.js — Danh sach truyen theo URL archive (tab trang chu / the loai /
// tac gia / suggest). The truyen: a.group (24 muc/trang o /danh-sach,
// 21 muc o /the-loai/tien-hiep). Phan trang ?page=N.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url, page) {
  if (!url) return Response.success([], "");
  if (!page) page = "1";

  var fetchUrl = buildListPageUrl(normalizeUrl(url), page);
  var r = fetchLtPage(fetchUrl);
  if (r.error) return Response.error(r.error);

  var data = collectStoryCards(r.doc);
  if (data.length === 0) return Response.success([], "");

  var next = detectNextPageToken(r.doc, page);
  return Response.success(data, next);
}
