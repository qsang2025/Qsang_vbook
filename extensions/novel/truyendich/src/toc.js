load('config.js');
load('rate-limit.js');
load('safe-first.js');

function buildChapterName(element) {
  var spans = element.select("span");
  if (!spans || spans.size() === 0) return cleanText(element.text());

  var chapterLabel = cleanText(spans.first().text());
  if (!chapterLabel) return cleanText(element.text());

  var subtitle = cleanText(spans.last().text());
  if (!subtitle || subtitle === chapterLabel) return chapterLabel;
  if (subtitle.indexOf(chapterLabel) === 0) return subtitle;

  return chapterLabel + " " + subtitle;
}

function execute(url) {
  var route = parseRoute(url);
  if (!route) return Response.error("URL truyện không hợp lệ.");

  var tocUrl = buildRoute({
    edition: route.edition,
    slug: route.slug,
    kind: route.kind === "page" ? "page" : "detail",
    pageNo: route.pageNo || 1,
  });
  var response = fetchPage(buildAbsoluteUrl(tocUrl));
  if (!response.ok) return Response.error("HTTP " + response.status);

  var doc = response.html();
  // Luu y: doc.select(...).first() KHONG bao gio tra null tren runtime
  // vBook (select rong van tra object truthy) nen dung safeFirst de
  // fallback sang toan trang khi khong co section chuong.
  var chapterSection = safeFirst(doc.select("section:has(h2:contains(Danh sách chương))"));
  var chapterElements = chapterSection
    ? chapterSection.select("a[href*=/chuong-]")
    : doc.select("a[href*=/chuong-]");

  var data = [];
  chapterElements.forEach(function (element) {
    var chapterRoute = parseRoute(element.attr("href"));
    if (!chapterRoute || chapterRoute.kind !== "chapter") return;
    chapterRoute.edition = route.edition;

    data.push({
      name: buildChapterName(element),
      url: buildRoute(chapterRoute),
      host: BASE_URL,
    });
  });

  return Response.success(data);
}
