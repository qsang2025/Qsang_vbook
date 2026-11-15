// gen.js — danh sach truyen theo the loai / bang xep hang (piaotia.com).
//
// execute(input, page): input la duong dan danh sach (vd /booksort1/0/1.html,
// /booktopallvisit/0/1.html); page la token trang ke (duong dan day du) hoac "".
// Selector that (kiem chung live 2026-11-15):
// - Dong truyen: table.grid tr (parseGridRow trong helper.js), 30 muc/trang.
// - Phan trang: link ">" trong pager -> /booksort<N>/0/<N+1>.html;
//   neu link ">" tro ve chinh trang hien tai hoac khong co thi het.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

function execute(url, page) {
    var path = page ? String(page) : String(url || "");
    if (!path) return Response.error("Thiếu đường dẫn danh sách.");
    if (path.charAt(0) !== "/") path = "/" + path;
    var fullUrl = siteOrigin() + path;
    var r = fetchPtDoc(fullUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseGridRows(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện nào ở: " + path);
    }

    // Token trang ke: link ">" trong pager.
    var next = "";
    var pager = doc.select("a");
    var i = 0;
    for (i = 0; i < pager.size(); i++) {
        var a = pager.get(i);
        if (cleanText(a.text()) === ">") {
            var href = a.attr("href");
            if (href) {
                var resolved = href.charAt(0) === "/" ? href : resolvePtUrl(fullUrl, href);
                // Bo query neu co; chi giu path.
                var q = resolved.indexOf("?");
                if (q !== -1) resolved = resolved.substring(0, q);
                var origin = siteOrigin();
                if (resolved.indexOf(origin) === 0) resolved = resolved.substring(origin.length);
                if (resolved && resolved !== path) next = resolved;
            }
            break;
        }
    }
    return Response.success(items, next);
}
