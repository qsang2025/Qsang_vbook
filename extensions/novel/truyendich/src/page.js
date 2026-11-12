load('config.js');
load('rate-limit.js');
load('safe-first.js');

function toNumber(value) {
  var digits = cleanText(value).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function getChapterSection(doc) {
  return safeFirst(doc.select("section:has(h2:contains(Danh sách chương))"));
}

function getChapterCount(section) {
  if (!section) return 0;

  var fromLabel = 0;
  var labelMatch = cleanText(section.text()).match(/(\d[\d\.,]*)\s*Chương/i);
  if (labelMatch) fromLabel = toNumber(labelMatch[1]);

  var fromRanges = 0;
  section.select("button").forEach(function (element) {
    var match = cleanText(element.text()).match(
      /(\d[\d\.,]*)\s*-\s*(\d[\d\.,]*)/,
    );
    if (!match) return;

    var endNo = toNumber(match[2]);
    if (endNo > fromRanges) fromRanges = endNo;
  });

  return Math.max(fromLabel, fromRanges);
}

function getPageSize(section) {
  if (!section) return 50;

  var chapterCountOnCurrentPage = section.select("a[href*=/chuong-]").size();
  return chapterCountOnCurrentPage > 0 ? chapterCountOnCurrentPage : 50;
}

function getTotalPages(doc) {
  var section = getChapterSection(doc);
  var chapterCount = getChapterCount(section);
  if (!chapterCount) return 1;

  var pageSize = getPageSize(section);
  var totalPages = Math.ceil(chapterCount / pageSize);
  return totalPages > 0 ? totalPages : 1;
}

function execute(url) {
  var route = parseRoute(url);
  if (!route) return Response.error("URL truyện không hợp lệ.");

  var detailUrl = buildDetailRoute(route);
  var response = fetchPage(buildAbsoluteUrl(detailUrl));
  if (!response.ok) return Response.error("HTTP " + response.status);

  var totalPages = getTotalPages(response.html());
  var pages = [];
  for (var pageNo = 1; pageNo <= totalPages; pageNo++) {
    pages.push(
      buildRoute({
        edition: route.edition,
        slug: route.slug,
        kind: pageNo === 1 ? "detail" : "page",
        pageNo: pageNo,
      }),
    );
  }

  return Response.success(pages);
}
