// search.js — Tim kiem: GET /tim-kiem?q=<tu khoa>.
// LUU Y: tham so q tren /danh-sach BI BO QUA (tra lai danh sach mac
// dinh) nen phai dung trang /tim-kiem cua site (form GET). Ket qua dung
// chung the truyen a.group nhu gen.js; phan trang ?page=N neu co.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(key, page) {
  if (!key) return Response.success([], "");
  if (!page) page = "1";

  var url = BASE_URL + "/tim-kiem?q=" + encodeURIComponent(key);
  var fetchUrl = buildListPageUrl(url, page);
  var r = fetchLtPage(fetchUrl);
  if (r.error) return Response.error(r.error);

  var data = collectStoryCards(r.doc);
  if (data.length === 0) return Response.success([], "");

  var next = detectNextPageToken(r.doc, page);
  return Response.success(data, next);
}
