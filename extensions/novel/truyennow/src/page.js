// page.js — Cac trang muc luc.
// API /api/chapters/<slug> chi tra toi da 500 chuong dau (kiem chung tu
// VM 2026-11-14: truyen 637 chuong, API tra total 637 nhung chapters
// chi 500 muc, tham so limit/page/offset deu bi bo qua). Nen:
// - Truyen <= 500 chuong: chi 1 trang — URL chi tiet goc, toc.js doc
//   qua API.
// - Truyen > 500 chuong: trang dau van la URL chi tiet goc (toc.js doc
//   API, 500 chuong dau), cac trang sau la URL SSR
//   /truyen/<slug>?order=asc&page=N (50 chuong/trang) cho cac chuong
//   con lai — toc.js doc SSR khi URL co "page=".
// Tong so chuong lay tu API (truong total); neu API that bai thi doc
// tu trang chi tiet (so trong ngoac o tieu de "Danh Sách Chương (N)").
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
  url = normalizeUrl(url).split("#")[0].split("?")[0];
  if (url.charAt(url.length - 1) === "/") url = url.substring(0, url.length - 1);
  var slug = url.split("/").pop();
  if (!slug) return Response.error("Không xác định được truyện.");

  var total = 0;
  var apiData = fetchLtJson(BASE_URL + "/api/chapters/" + slug + "?order=asc");
  if (apiData && apiData.total) total = parseInt(apiData.total, 10);

  if (!total || isNaN(total)) {
    var r = fetchLtPage(url);
    if (r.error) return Response.error(r.error);
    var h2 = safeFirst(r.doc.select("#danh-sach-chuong h2"));
    if (h2) {
      var m = cleanText(h2.text()).match(/\((\d+)\)/);
      if (m) total = parseInt(m[1], 10);
    }
    if (!total || isNaN(total)) {
      var bodyText = cleanText(r.doc.text());
      var m2 = bodyText.match(/(\d+)\s*chương/);
      if (m2) total = parseInt(m2[1], 10);
    }
  }
  if (!total || isNaN(total) || total <= 0) {
    return Response.success([url]);
  }

  var pages = [url];
  if (total > 500) {
    var totalPages = Math.ceil(total / 50);
    var firstSsrPage = Math.floor(500 / 50) + 1;
    for (var p = firstSsrPage; p <= totalPages; p++) {
      pages.push(BASE_URL + "/truyen/" + slug + "?order=asc&page=" + p);
    }
  }
  return Response.success(pages);
}
