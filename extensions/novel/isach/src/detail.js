// detail.js — chi tiet sach.
//
// GET /story.php?story=<slug> — lay trong #motsach_content_body:
//   ten: div.ms_title a
//   bia: img.ms_image (src tuong doi /images/story/cover/<slug>.jpg)
//   tac gia: div.ms_author dau tien co link author
//   the loai: link category= trong cac div.ms_author
//   mo ta: cac div.ms_text noi lai
//   thong tin: "So chuong", "So lan doc/download", "Phi download" trong
//     cac div.ms_author.
// Site khong co tin hieu hoan thanh -> ongoing=true mac dinh (ghi ro la
// han che trong ISACH-PROGRESS.md). Ban tai ePub/mobi/PDF tren web can
// dang nhap + ton "gao" nen chi ghi chu trong detail, khong dua link tai
// (link tren trang co href rong, la JS alert).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = url || "";

    rateLimitDelay("isach.info");
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được trang truyện (HTTP " + response.status + ")");
    var doc = response.html();
    var body = safeFirst(doc.select("#motsach_content_body"));
    if (!body) return Response.error("Không tải được trang truyện.");

    var titleEl = safeFirst(body.select("div.ms_title a"));
    var name = titleEl ? titleEl.text().replace(/^\s+|\s+$/g, "") : "";
    if (!name) return Response.error("Không tải được trang truyện.");

    var coverEl = safeFirst(body.select("img.ms_image"));
    var cover = "";
    if (coverEl) cover = absUrl(coverEl.attr("src"));

    var author = "";
    var genres = [];
    var infoParts = [];
    var meta = body.select("div.ms_author");
    for (var i = 0; i < meta.size(); i++) {
        var div = meta.get(i);
        var text = div.text().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        var links = div.select("a");
        for (var j = 0; j < links.size(); j++) {
            var href = links.get(j).attr("href") || "";
            var label = links.get(j).text().replace(/^\s+|\s+$/g, "");
            if (href.indexOf("author=") >= 0 && !author) {
                author = label;
            }
            if (href.indexOf("category=") >= 0 && label) {
                genres.push({title: label, input: absUrl(href) + "&order=story_id", script: "list.js"});
            }
        }
        if (text.indexOf("Số chương:") === 0 || text.indexOf("Số lần đọc/download:") === 0 || text.indexOf("Phí download:") === 0) {
            infoParts.push(text);
        }
    }

    var des = "";
    var descEls = body.select("div.ms_text");
    for (var k = 0; k < descEls.size(); k++) {
        var t = descEls.get(k).text().replace(/^\s+|\s+$/g, "");
        if (t) des += (des ? "<br>" : "") + t;
    }

    var info = infoParts.join(" | ");
    info += (info ? " | " : "") + "Bản tải ePub/mobi/PDF trên web cần đăng nhập và tốn gạo — app chỉ đọc online.";

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: des,
        detail: info,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: true,
        genres: genres,
        suggests: []
    });
}
