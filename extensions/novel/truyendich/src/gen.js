load('config.js');
load('rate-limit.js');

const PAGE_SIZE = 20;

function buildApiUrl(input, pageNo) {
  if (input.indexOf("list:") === 0) {
    return (
      BASE_URL +
      "/api/lists/" +
      input.replace("list:", "") +
      "?page=" +
      pageNo +
      "&size=" +
      PAGE_SIZE
    );
  }

  if (input.indexOf("category:") === 0) {
    return (
      BASE_URL +
      "/api/categories/" +
      input.replace("category:", "") +
      "?page=" +
      pageNo +
      "&size=" +
      PAGE_SIZE
    );
  }

  return "";
}

function buildDescription(item) {
  var parts = [];
  if (item.author) parts.push(cleanText(item.author));
  if (item.latest_chapter_number) {
    parts.push("Chương " + item.latest_chapter_number);
  }
  if (item.status === "completed") parts.push("Full");
  if (item.status === "ongoing") parts.push("Đang ra");
  return parts.join(" | ");
}

function mapNovel(item) {
  return {
    name: cleanText(item.title),
    link: buildRoute({ edition: "base", slug: item.slug, kind: "detail" }),
    host: BASE_URL,
    cover: buildAbsoluteUrl(item.image_url),
    description: buildDescription(item),
  };
}

function execute(input, page) {
  input = cleanText(input);
  var pageNo = parseInt(page || "1", 10);
  if (!pageNo || pageNo < 1) pageNo = 1;

  var apiUrl = buildApiUrl(input, pageNo);
  if (!apiUrl) return Response.error("Input không hợp lệ.");

  var r = pacedFetch(apiUrl);
  if (!r.ok) {
    if (r.status === 429 || r.status === 405) {
      return Response.error(rateLimitErrorMessage("TruyenDich.AI", pacedHostOf(apiUrl), r.cooldownRemainingMs));
    }
    return Response.error(r.status ? "HTTP " + r.status : "Không tải được danh sách.");
  }

  var payload = r.res.json();
  var items = payload && payload.items ? payload.items : [];
  var data = [];
  items.forEach(function (item) {
    if (!item || !item.slug || !item.title) return;
    data.push(mapNovel(item));
  });

  var total = payload && payload.total ? parseInt(payload.total, 10) : 0;
  var next = "";
  if (total > pageNo * PAGE_SIZE) next = String(pageNo + 1);
  if (!next && !total && items.length === PAGE_SIZE) next = String(pageNo + 1);

  return Response.success(data, next);
}
