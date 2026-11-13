// genre.js — Danh sach the loai tu trang /the-loai.
// Trang liet ke ~50 muc a[href^="/the-loai/"] (ten + so truyen). LOC
// muc "18+" (slug /the-loai/18) — khong dua vao danh sach the loai cua
// extension. Neu fetch /the-loai that bai thi tra loi tieng Viet.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
  var r = fetchLtPage(BASE_URL + "/the-loai");
  if (r.error) return Response.error(r.error);
  var doc = r.doc;

  var list = [];
  var seen = {};
  var links = doc.select("a[href^=\"/the-loai/\"]");
  for (var i = 0; i < links.size(); i++) {
    var a = links.get(i);
    var href = String(a.attr("href") || "").trim();
    if (!href) continue;
    var full = normalizeUrl(href);
    if (seen[full]) continue;
    seen[full] = true;
    // Bo muc 18+ (slug /the-loai/18).
    if (full.replace(/\/+$/, "").match(/\/the-loai\/18$/)) continue;
    var title = cleanText(a.text()).replace(/\s*\d+\s*truyện\s*$/i, "");
    if (!title) continue;
    list.push({ title: title, input: full, script: "gen.js" });
  }
  if (list.length === 0) return Response.error("Không tải được danh sách thể loại.");
  return Response.success(list);
}
