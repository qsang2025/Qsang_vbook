// toc.js — Muc luc: GET /api/chapters/<slug>?order=asc.
// API tra JSON {chapters: [{chapter_number, title}], total} — DU 1 lan
// khi tong <= 500 chuong. API CHI TRA TOI DA 500 chuong dau (truyen 637
// chuong: total 637 nhung chapters chi 500 muc; limit/page/offset deu bi
// bo qua) nen truyen > 500 chuong can page.js: toc.js duoc goi them voi
// URL SSR /truyen/<slug>?order=asc&page=N (50 chuong/trang) cho cac
// chuong con lai — nhan biet bang "page=" trong URL.
// Neu API that bai thi fallback ve SSR: parse 50 chuong dau tren trang
// chi tiet (#story-chlist a.story-ch-item).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function tocFromSsr(doc) {
  var items = [];
  var links = doc.select("#story-chlist a.story-ch-item");
  for (var j = 0; j < links.size(); j++) {
    var a = links.get(j);
    var href = String(a.attr("href") || "").trim();
    if (!href) continue;
    // Ten chuan "Chương N: Tựa" nhu API: span dau "Ch.N", span .truncate
    // la tua de (text tran cua <a> con dinh ca ngay "16/9/2026" o cuoi).
    var name = "";
    var numSpan = safeFirst(a.select("span"));
    var titleSpan = safeFirst(a.select("span.truncate"));
    if (numSpan && titleSpan) {
      var numText = cleanText(numSpan.text()).replace(/^Ch\.\s*/i, "");
      var titleText = cleanText(titleSpan.text());
      if (numText && titleText) name = "Chương " + numText + ": " + titleText;
    }
    if (!name) {
      name = cleanText(a.text()).replace(/\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/, "");
    }
    if (!name) continue;
    items.push({ name: name, url: normalizeUrl(href), host: BASE_URL });
  }
  return items;
}

function execute(url) {
  url = normalizeUrl(url);
  var slug = url.replace(/\/+$/, "").split("/").pop().split("?")[0];
  if (!slug) return Response.error("Không xác định được truyện.");

  // Trang SSR (tu page.js): doc truc tiep danh sach chuong cua trang do.
  if (url.indexOf("page=") !== -1) {
    var r = fetchLtPage(url);
    if (r.error) return Response.error(r.error);
    var ssrItems = tocFromSsr(r.doc);
    if (ssrItems.length === 0) return Response.error("Không tải được danh sách chương.");
    return Response.success(ssrItems);
  }

  var apiUrl = BASE_URL + "/api/chapters/" + slug + "?order=asc";
  var data = fetchLtJson(apiUrl);
  if (data && data.chapters && data.chapters.length > 0) {
    var list = [];
    for (var i = 0; i < data.chapters.length; i++) {
      var ch = data.chapters[i];
      var num = ch.chapter_number;
      var title = String(ch.title || "").trim();
      if (num === undefined || num === null) continue;
      var name = "Chương " + num;
      if (title) name += ": " + title;
      list.push({
        name: name,
        url: BASE_URL + "/truyen/" + slug + "/doc/" + num,
        host: BASE_URL
      });
    }
    if (list.length > 0) return Response.success(list);
  }

  // Fallback SSR: 50 chuong dau tren trang chi tiet.
  var r2 = fetchLtPage(url);
  if (r2.error) return Response.error(r2.error);
  var items = tocFromSsr(r2.doc);
  if (items.length === 0) return Response.error("Không tải được danh sách chương.");
  return Response.success(items);
}
