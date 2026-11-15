// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [chuong]).
//
// Trang truyen co table.chapter-table (10 chuong/trang, kiem chung live
// 2026-11-15: Tyrant 885 chuong = 89 trang). Ham nay tra trang 1;
// cac trang sau do page.js liet ke de app goi toc.js tung trang.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var novel = novelByUrl(url);
    if (!novel) return Response.error("Link truyện không hợp lệ.");
    var tocUrl = absUrl(novel.url);
    var r = fetchMrDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseTocRows(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }
    return Response.success(items);
}
