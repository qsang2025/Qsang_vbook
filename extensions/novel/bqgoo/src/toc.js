// toc.js — muc luc cua Bqgoo (bqgooo.cc).
// URL nhan vao la link chi tiet https://www.bqgooo.cc/shu/<id>/.
//   GET /api/booklist?id=<id>
// Tra ve {list:[ten chuong...]} — vd. 1985 co 7.854 muc. chapterid =
// vi tri trong list + 1 (chuong dau tien la 1). Link chuong dang
// /shu/<id>/<chapterid>.html. Chi 1 trang duy nhat, khong can page.js.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// rate-limit.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var id = parseBookId(url);
    if (!id) return Response.error("URL truyện không hợp lệ: " + url);

    rateLimitDelay("apibi.cc");
    var j = fetchJsonWithFallback("/api/booklist?id=" + id);
    if (!j) return Response.error("Không tải được mục lục: " + bookUrl(id));

    var list = j.list || [];
    if (list.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + bookUrl(id));
    }

    var items = [];
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var name = cleanText(list[i] || "");
        if (!name) continue;
        var chapterid = i + 1;
        items.push({
            name: name,
            url: chapterUrl(id, chapterid),
            description: "",
            lock: false,
            pay: false,
            host: BOOK_ORIGIN
        });
    }

    if (items.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + bookUrl(id));
    }

    return Response.success(items);
}
