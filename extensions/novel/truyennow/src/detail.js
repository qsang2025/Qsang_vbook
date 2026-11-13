// detail.js — Chi tiet truyen: /truyen/<slug>/.
// Ten: h1. Anh bia: img[src*="/covers/"] co alt trung ten truyen.
// Tac gia: site KHONG hien tac gia tren trang chi tiet — tac gia la
// Long Thieu (xac minh: moi ket qua API suggest deu tra author
// "Long Thiếu"; footer trang chuong ghi "Tác phẩm của Long Thiếu").
// Trang thai: span badge ("Hoàn thành" / "Đang ra"). The loai: pill
// a[href*="/the-loai/"] co style chua var(--accent) (link the loai o
// footer/nav khong co style nay; LOC pill "18+" khoi danh sach the
// loai). Mo ta: div dau cua #tab-intro.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
  url = normalizeUrl(url);
  if (url.charAt(url.length - 1) !== "/") url += "/";
  var r = fetchLtPage(url);
  if (r.error) return Response.error(r.error);
  var doc = r.doc;

  var name = "";
  var nameEl = safeFirst(doc.select("h1"));
  if (nameEl) name = cleanText(nameEl.text());
  if (!name) return Response.error("Không tìm thấy thông tin truyện.");

  var cover = "";
  var coverImgs = doc.select("img[src*=\"/covers/\"]");
  for (var i = 0; i < coverImgs.size(); i++) {
    var imgEl = coverImgs.get(i);
    var alt = cleanText(imgEl.attr("alt"));
    var src = String(imgEl.attr("src") || "").trim();
    if (!src) continue;
    if (alt === name) {
      cover = normalizeUrl(src);
      break;
    }
    if (!cover) cover = normalizeUrl(src);
  }

  var author = "Long Thiếu";

  var statusText = "Đang cập nhật";
  var spans = doc.select("span");
  for (var j = 0; j < spans.size(); j++) {
    var st = cleanText(spans.get(j).text());
    if (st === "Hoàn thành" || st === "Đang ra" || st === "Tạm ngưng") {
      statusText = st;
      break;
    }
  }
  var lowerStatus = statusText.toLowerCase();
  var ongoing = lowerStatus.indexOf("hoàn thành") === -1 &&
                lowerStatus.indexOf("đã hoàn") === -1 &&
                lowerStatus.indexOf("full") === -1 &&
                lowerStatus.indexOf("complete") === -1;

  var genres = [];
  var genreTexts = [];
  var genreLinks = doc.select("a[href*=\"/the-loai/\"][style*=\"var(--accent)\"]");
  for (var k = 0; k < genreLinks.size(); k++) {
    var catA = genreLinks.get(k);
    var catName = cleanText(catA.text());
    var catHref = String(catA.attr("href") || "").trim();
    if (!catName || !catHref) continue;
    var fullHref = normalizeUrl(catHref);
    if (fullHref.replace(/\/+$/, "").match(/\/the-loai\/18$/)) continue;
    genres.push({ title: catName, input: fullHref, script: "gen.js" });
    genreTexts.push(catName);
  }

  var description = "";
  var descEl = safeFirst(doc.select("#tab-intro > div"));
  if (descEl) description = cleanText(descEl.text()).substring(0, 500);

  var suggests = [];
  if (genres.length > 0) {
    suggests.push({ title: "Truyện cùng thể loại", input: genres[0].input, script: "gen.js" });
  }

  var detailParts = [];
  detailParts.push("<p><strong>Tác giả:</strong> " + author + "</p>");
  detailParts.push("<p><strong>Trạng thái:</strong> " + statusText + "</p>");
  if (genreTexts.length > 0) {
    detailParts.push("<p><strong>Thể loại:</strong> " + genreTexts.join(", ") + "</p>");
  }
  var detail = detailParts.join("");

  return Response.success({
    name: name,
    cover: cover,
    author: author,
    description: description,
    detail: detail,
    url: url,
    type: "novel",
    format: "novel",
    ongoing: ongoing,
    genres: genres,
    suggests: suggests,
    host: BASE_URL
  });
}
