// gen.js — Trang danh sach AkayTruyen (akaytruyen.com).
//
// Dung chung cho tab trang chu (home.js) va the loai (genre.js):
// input la duong dan danh sach ("/", "/the-loai/<slug>") hoac URL day du.
// Trang the loai hien 16 truyen va KHONG phan trang (kiem chung live
// 2026-11-13: ?page=2 tra giong het trang 1) nen luon tra data2 = "".
// Trang chu chua nhieu muc lap lai cung truyen nen dedupe theo link.
// execute(input, page).
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
    if (!input) input = "/";
    var url = input;
    if (url.indexOf("http") !== 0) {
        url = BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    }
    url = normalizeUrl(url);

    var r = fetchAkDoc(url);
    if (r.error) return Response.error(r.error);

    var items = parseStoryCards(r.doc);
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, "");
}
