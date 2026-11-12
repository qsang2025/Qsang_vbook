// search.js — Tim kiem truyen tren AkayTruyen (akaytruyen.com).
//
// Tim kiem HOAT DONG qua GET /tim-kiem?key_word=<tu khoa> (kiem chung live
// 2026-11-13: "thien la" tra 1 ket qua, "con duong" co dau tra 1 ket qua;
// tham so dung la key_word=, q= KHONG loc). LUU Y: site CHI tra ket qua
// khi go CO DAU — go khong dau ("con duong") tra 0 ket qua (meta cua trang
// ket qua ghi ro "Tim thay 0 truyen phu hop"). Ket qua dung the
// .story-item-list trong .list-story-in-category; trang ket qua khong co
// phan trang nen luon tra data2 = "".
// execute(query, page).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm.");

    var url = BASE_URL + "/tim-kiem?key_word=" + encodeURIComponent(query);
    var r = fetchAkDoc(url);
    if (r.error) return Response.error(r.error);

    var items = parseStoryCards(r.doc);
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, "");
}
