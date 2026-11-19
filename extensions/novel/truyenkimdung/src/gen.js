// gen.js — Trang danh sach Truyen Kim Dung (truyenkimdung.net).
//
// Dung chung cho tab trang chu (home.js), phien ban (genre.js) va goi y
// trong detail.js: input la duong dan danh sach (/?..., /?version=...),
// page la token trang sau (URL day du tu link "Sau", hoac so trang "2"
// khi test tay, "" = trang dau). Thu vien chi 20 bo, pageSize=20 thi
// vua 1 trang; pageSize=10 thi 2 trang. execute(input, page).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(input, page) {
    input = input || "";
    page = page || "";
    if (!input) return Response.error("Thiếu đường dẫn danh sách.");

    var url = "";
    if (page.indexOf("http") === 0) {
        url = page;
    } else if (page && !isNaN(parseInt(page, 10))) {
        url = withPageParam(absUrl(input), page);
    } else {
        url = absUrl(input);
    }

    var r = fetchTkDoc(url);
    if (r.error) return Response.error(r.error);

    var items = parseBookList(r.doc);
    if (items.length === 0) return Response.success([], "");
    var next = nextPageUrl(r.doc);
    return Response.success(items, next);
}
