// chap.js — Noi dung chuong LilyHub.
// Noi dung nam o media CDN duoi dang .txt, doan cach nhau bang dong trong.
// File luon mo dau bang "Chương N:" + mot dong "=====" phan cach, va co the
// ket thuc bang "=====" -> can bo 2 thu do di.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    var raw = url + "";
    var id = lilyNovelId(raw);
    if (!id) return Response.error("Không đọc được mã truyện từ URL này.");

    // so chuong = doan cuoi cua URL
    var segs = raw.replace(/^\s+|\s+$/g, "").split("/");
    var last = segs[segs.length - 1] + "";
    var num = /^[0-9]+$/.test(last) ? parseInt(last, 10) : 0;

    var rows = lilyQuery("chapters?select=chapter_number,title,content_key&novel_id=eq." + id + "&chapter_number=eq." + num + "&limit=1");
    if (!rows) return Response.error("Không lấy được nội dung chương từ LilyHub.");
    if (!rows.length) return Response.error("Không tìm thấy chương " + num + " của truyện này.");

    var key = rows[0].content_key + "";
    if (!key) return Response.error("Chương này chưa có nội dung.");

    var txt = lilyFetchText(LILY_MEDIA + key);
    if (!txt) return Response.error("Không tải được nội dung chương.");

    // tach doan theo dong trong
    var blocks = txt.replace(/\r/g, "").split(/\n\s*\n/);
    var html = "";
    var used = 0;
    for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i].replace(/^\s+|\s+$/g, "");
        if (!b) continue;
        // bo dong tieu de "Chương N:" va cac duong ke "=====" / "-----"
        if (/^chương\s*\d+\s*[:：]?\s*$/i.test(b)) continue;
        if (/^[=\-*_~#]{3,}$/.test(b)) continue;
        var oneLine = b.replace(/\n/g, "<br/>");
        html += "<p>" + lilyEscape(oneLine).replace(/&lt;br\/&gt;/g, "<br/>") + "</p>\n";
        used++;
    }

    if (used === 0 || html.length < 20) return Response.error("Chương này chưa có nội dung.");
    var title = rows[0].title ? rows[0].title + "" : "Chương " + num;
    return Response.success(html, title);
}
