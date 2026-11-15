// gen.js — danh sach sach theo the loai / tag (execute(url, page) -> items).
//
// - Trang the loai /List/default.aspx?tid=<id>: 20 muc/trang, bo cuc
//   ul.Comic_Pic_List; phan trang ?PageIndex=<n> (kiem chung live:
//   li.pagebarNext a -> ...&PageIndex=2).
// - Trang tag /stag/<id>/: 10 muc/trang, bo cuc ul.TAG_list; phan trang
//   /stag/<id>/<n>/ (kiem chung live: /stag/55/2/, .pagebarFlip a
//   "下一页").
// - next token la so trang dang so (chuoi); "" khi het.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url, page) {
    page = String(page || "");
    var pageNum = 1;
    if (page !== "") {
        pageNum = parseInt(page, 10);
        if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    }
    url = normalizeSfUrl(url);
    if (!url) return Response.error("Đường dẫn danh sách trống.");
    var fetchUrl = url;
    if (url.indexOf("/stag/") !== -1) {
        fetchUrl = url.replace(/\/+$/, "") + "/" + pageNum + "/";
    } else {
        var sep = fetchUrl.indexOf("?") === -1 ? "?" : "&";
        fetchUrl = fetchUrl + sep + "PageIndex=" + pageNum;
    }

    var r = fetchSfDoc(fetchUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var items = [];
    var seen = {};
    var i = 0;

    var lists = doc.select("ul.Comic_Pic_List");
    if (lists.size() === 0) lists = doc.select("ul.TAG_list");
    for (i = 0; i < lists.size(); i++) {
        var one = parseBookCard(lists.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    if (items.length === 0) {
        return Response.error("Không tìm thấy sách ở trang này.");
    }

    var next = "";
    var nextEl = safeFirst(doc.select("li.pagebarNext a"));
    if (nextEl !== null && nextEl.attr("href")) {
        next = String(pageNum + 1);
    } else {
        var flips = doc.select(".pagebarFlip a");
        for (i = 0; i < flips.size(); i++) {
            if (flips.get(i).text().indexOf("下一页") !== -1) {
                next = String(pageNum + 1);
                break;
            }
        }
    }
    return Response.success(items, next);
}
