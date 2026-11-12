load('config.js');
load('rate-limit.js');

const FALLBACK_GENRES = [
  ["Tiên Hiệp", "tien-hiep"],
  ["Kiếm Hiệp", "kiem-hiep"],
  ["Ngôn Tình", "ngon-tinh"],
  ["Đô Thị", "do-thi"],
  ["Huyền Huyễn", "huyen-huyen"],
  ["Võng Du", "vong-du"],
  ["Khoa Huyễn", "khoa-huyen"],
  ["Hệ Thống", "he-thong"],
  ["Dị Giới", "di-gioi"],
  ["Lịch Sử", "lich-su"],
  ["Quân Sự", "quan-su"],
  ["Trinh Thám", "trinh-tham"],
  ["Thám Hiểm", "tham-hiem"],
  ["Linh Dị", "linh-di"],
  ["Mạt Thế", "mat-the"],
  ["Xuyên Nhanh", "xuyen-nhanh"],
  ["Nữ Cường", "nu-cuong"],
  ["Cung Đấu", "cung-dau"],
  ["Đam Mỹ", "dam-my"],
  ["Bách Hợp", "bach-hop"],
];

function buildGenreItem(title, slug) {
  return {
    title: title,
    input: "category:" + slug,
    script: "gen.js",
  };
}

function execute() {
  // Trang /the-loai tra 404 (kiem chung 2026-11-12) nen doc the loai tu
  // trang chu — nav co du 20 the loai; neu fetch loi thi dung danh sach cung.
  var response = fetchPage(BASE_URL + "/");
  if (response.ok) {
    var doc = response.html();
    var data = [];
    var seen = {};
    doc.select("a[href^=/the-loai/]").forEach(function (element) {
      var href = normalizeUrl(element.attr("href"));
      var match = href.match(/^\/the-loai\/([^/?#]+)/);
      var title = cleanText(element.text());
      if (!match || !title || seen[match[1]]) return;
      seen[match[1]] = true;
      data.push(buildGenreItem(title, match[1]));
    });
    if (data.length > 0) return Response.success(data);
  }

  return Response.success(
    FALLBACK_GENRES.map(function (item) {
      return buildGenreItem(item[0], item[1]);
    }),
  );
}
