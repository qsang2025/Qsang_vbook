// search.js — Tim kiem truyen/chuong (execute(query, page) -> items, next).
//
// GET /?s=<tu khoa> (WordPress mac dinh, kiem chung live 2026-11-15).
// Ket qua tron 3 loai bai: bai chuong that (-chapter-<n>), bai thong bao
// NEW CHAPTERS / SIDE STORIES (chi la thong bao, khong co noi dung
// chuong) va bai gioi thieu truyen. Chi giu bai chuong that va trang
// truyen; loc bo bai thong bao.
// Phan trang: /page/2/?s=<kw> (href that trong .pagination).
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

function execute(query, page) {
    var searchUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        searchUrl = String(page);
        if (searchUrl.indexOf("http") !== 0) searchUrl = absUrl(searchUrl);
    } else {
        if (!query) return Response.error("Thiếu từ khóa tìm kiếm.");
        searchUrl = BASE_URL + "/?s=" + encodeURIComponent(query);
    }
    var r = fetchMrDoc(searchUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var raw = parseArticleList(doc);
    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < raw.length; i++) {
        var link = raw[i].link;
        var isChapter = /-chapter-\d+\/?$/.test(link);
        var isNovel = isNovelPageUrl(link);
        if (!isChapter && !isNovel) continue;
        if (seen[link]) continue;
        seen[link] = true;
        items.push(raw[i]);
    }
    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện/chương nào khớp từ khóa.");
    }

    var next = nextPageHref(doc, searchUrl);
    return Response.success(items, next);
}
