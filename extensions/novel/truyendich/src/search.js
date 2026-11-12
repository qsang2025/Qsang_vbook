load('config.js');
load('rate-limit.js');

function buildDescription(card) {
  var box = card.select("div:has(> span:contains(Chương))").last();
  return box ? cleanText(box.text()) : "";
}

function execute(key, page) {
  key = safeString(key);
  if (!key) return Response.success([]);

  var pageNo = parseInt(page || "1", 10);
  if (!pageNo || pageNo < 1) pageNo = 1;

  var response = fetchPage(
    BASE_URL + "/tim-kiem?q=" + encodeURIComponent(key) + "&page=" + pageNo,
  );
  if (!response.ok) return Response.error("HTTP " + response.status);

  var doc = response.html();
  var nextHref = doc.select("main a:contains(Trang sau)").attr("href");
  var match = nextHref.match(/[?&]page=(\d+)/);
  var next = match ? match[1] : "";

  var data = [];
  doc.select("main a.group[href^=/doc-truyen/]").forEach(function (card) {
    var name = cleanText(card.select("h3").text());
    var link = normalizeUrl(card.attr("href"));
    if (!name || !link) return;

    data.push({
      name: name,
      link: link,
      host: BASE_URL,
      cover: buildAbsoluteUrl(card.select("img").attr("src")),
      description: buildDescription(card),
    });
  });

  return Response.success(data, next);
}
