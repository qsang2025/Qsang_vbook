load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
  var route = parseRoute(url);
  if (!route) return Response.error("URL chương không hợp lệ.");

  var response = fetchPage(buildAbsoluteUrl(buildRoute(route)));
  if (!response.ok) return Response.error("HTTP " + response.status);

  var doc = response.html();
  // Luu y: .first() KHONG bao gio tra null tren runtime vBook nen chuoi
  // fallback || ben duoi se khong bao gio chay — dung safeFirst.
  var contentRoot =
    safeFirst(doc.select("section.prose-novel")) ||
    safeFirst(doc.select("[itemprop=text]")) ||
    safeFirst(doc.select("[itemProp=text]"));
  if (!contentRoot) return Response.error("Không tìm thấy nội dung chương.");

  contentRoot.select("script,style,button,nav").remove();
  var content = safeFirst(contentRoot.select("div"));
  return Response.success(
    content ? content.html() : contentRoot.html(),
    cleanText(doc.select("main h1").first().text()),
  );
}
