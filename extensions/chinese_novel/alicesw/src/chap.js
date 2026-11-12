// chap.js — noi dung mot chuong alicesw (/book/<id>/<hash>.html).
// Noi dung that nam trong .content_txt (HTML thuan, khong ma hoa).
// data2 tra ve tieu de chuong (h1#chapterTitle).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = toWww(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
    var doc = response.html();
    var contentEl = safeFirst(doc.select(".content_txt"));
    if (!contentEl) return Response.error("Không đọc được nội dung chương");
    var titleEl = safeFirst(doc.select("h1#chapterTitle"));
    var title = titleEl ? titleEl.text() : "";
    return Response.success(contentEl.html(), title);
}
