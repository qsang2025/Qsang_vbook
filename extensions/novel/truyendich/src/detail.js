load('config.js');
load('rate-limit.js');

function textFromFirst(element) {
  return element ? cleanText(element.text()) : "";
}

function htmlFromFirst(element) {
  return element ? element.html() : "";
}

function readInfoValue(doc, label) {
  var value = doc
    .select("div:has(> div > span:contains(" + label + ")) > p")
    .first();
  return value ? cleanText(value.text()) : "";
}

function extractGenres(doc) {
  var data = [];
  var seen = {};
  // Chi lay the loai cua chinh truyen nay (khoi "Thể loại" trong phan thong
  // tin) — khong lay link the loai o nav cua site (du 20 muc cho moi truyen).
  doc.select("div:has(> div > span:contains(Thể loại)) a[href^=/the-loai/]").forEach(function (element) {
    var href = normalizeUrl(element.attr("href"));
    var match = href.match(/^\/the-loai\/([^/?#]+)/);
    var title = cleanText(element.text());
    if (!match || !title || seen[match[1]]) return;
    seen[match[1]] = true;
    data.push({
      title: title,
      input: "category:" + match[1],
      script: "gen.js",
    });
  });
  return data;
}

function extractSuggests(doc, currentRoute) {
  if (collectSiblingEditionEntries(doc, currentRoute).length === 0) return [];
  return [
    {
      title: "Các bản dịch khác",
      input: buildDetailRoute(currentRoute),
      script: "edition.js",
    },
  ];
}

function buildDetailText(route, name, author, chapterCount, updatedAt, status) {
  var lines = ["Tên truyện: " + name, "Tác giả: " + (author || "Không rõ")];
  if (chapterCount) lines.push("Số chương: " + chapterCount);
  if (updatedAt) lines.push("Cập nhật: " + updatedAt);
  if (status) lines.push("Trạng thái: " + status);
  lines.push("Phiên bản: " + getEditionTitle(route.edition));
  return lines.join("<br>");
}

function execute(url) {
  var route = parseRoute(url);
  if (!route) return Response.error("URL truyện không hợp lệ.");

  var detailUrl = buildDetailRoute(route);
  var response = fetchPage(buildAbsoluteUrl(detailUrl));
  if (!response.ok) return Response.error("HTTP " + response.status);

  var doc = response.html();
  var chapterCount = readInfoValue(doc, "Số chương");
  var updatedAt = readInfoValue(doc, "Cập nhật");
  var status = readInfoValue(doc, "Trạng thái");
  // The <p> trạng thái còn chứa span chỉ hiện trên mobile ("• 2,337 chương") — cắt bỏ.
  status = status.replace(/•.*$/, "").trim();
  var name = textFromFirst(doc.select("main header h1").first());
  var author = readInfoValue(doc, "Tác giả");
  // Co truyen site luu ten tac gia kem tien to "Tác Giả: ..." — cat bo.
  author = author.replace(/^(tác giả|tac gia)\s*:\s*/i, "");

  return Response.success({
    name: name,
    cover: buildAbsoluteUrl(doc.select("main header img").attr("src")),
    host: BASE_URL,
    author: author,
    description: htmlFromFirst(doc.select("section .prose").first()),
    detail: buildDetailText(route, name, author, chapterCount, updatedAt, status),
    url: buildAbsoluteUrl(detailUrl),
    type: "novel",
    format: "novel",
    ongoing: status.indexOf("Đang ra") >= 0,
    nsfw: false,
    locale: "vi_VN",
    tags: [],
    genres: extractGenres(doc),
    suggests: extractSuggests(doc, route),
    reviews: [],
    comments: [],
  });
}
