// chap.js — Noi dung chuong: /truyen/<slug>/doc/<n>.
// Noi dung that nam trong bien _ed cua script bao ve: base64(URL-encode
// (HTML)) — giai ma khong khoa (xem helper.js decodeChapterHtml).
// Runtime khong chay JS trang nen DevTools detection cua site khong anh
// huong. Neu khong thay _ed thi bao loi tieng Viet ro rang.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
  url = normalizeUrl(url);
  var r = fetchLtPage(url);
  if (r.error) return Response.error(r.error);

  if (r.rawHtml.indexOf("Vui lòng đóng Developer Tools") !== -1 &&
      r.rawHtml.indexOf("var _ed") === -1) {
    return Response.error("Chương bị chặn đọc — hãy mở truyện trong trình duyệt của app một lần rồi thử lại.");
  }

  var content = decodeChapterHtml(r.rawHtml);
  if (!content) {
    return Response.error("Không tải được nội dung chương — trang đã đổi giao diện hoặc chương chưa có nội dung.");
  }

  var title = "";
  var titleEl = safeFirst(r.doc.select("h1.chapter-title"));
  if (titleEl) title = cleanText(titleEl.text());
  if (!title) {
    var m = url.match(/\/doc\/(\d+)/);
    if (m) title = "Chương " + m[1];
  }

  return Response.success(content, title);
}
