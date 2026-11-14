// chap.js — noi dung chuong (wfxs.tw).
// Nhan URL chuong /xiaoshuo/<id>/<chapterId>/.
// Tieu de tu .chapter-content h1 (dang "冥婚- 第1章" — bo tien to ten
// truyen). Noi dung trong .chapter-content .content: 1..N <p>, hoac 1 <p>
// lon chua toan bo chuong ngan cach bang \n — tach dong bang toLines()
// (helper.js). Khong co phan trang con, khong khoa noi dung.
// Tra ve HTML cac <p> + tieu de chuong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocPaced(url);
    if (!doc) return Response.error("Không tải được chương (" + lastFetchError + "): " + url);

    var contentEl = safeFirst(doc.select(".chapter-content .content"));
    if (!contentEl) return Response.error("Không đọc được nội dung chương: " + url);

    var lines = toLines(contentEl.html());
    if (lines.length === 0) {
        return Response.error("Chương này không có nội dung: " + url);
    }

    var title = "";
    var titleEl = safeFirst(doc.select(".chapter-content h1"));
    if (titleEl) {
        title = cleanText(titleEl.text());
        // Bo tien to ten truyen dang "冥婚- 第1章" -> "第1章".
        var dash = title.indexOf("- ");
        if (dash > 0) title = title.substring(dash + 2);
        title = title.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "");
    }
    // Neu tieu de trung dong dau cua noi dung thi bo dong dau di.
    if (title && lines.length > 0 && lines[0] === title) lines.shift();

    var html = "";
    var i = 0;
    for (i = 0; i < lines.length; i++) {
        html += "<p>" + escapeHtml(lines[i]) + "</p>";
    }
    return Response.success(html, title);
}
