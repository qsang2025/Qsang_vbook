// list.js — danh sach chung cho tab trang chu va the loai.
//   "/all/<gender>-<cat>-<sub>-<status>-<words>-<tag>-<sort>-<page>/"
//       danh sach loc (24 truyen/trang, phan trang chay — kiem chung live
//       2026-11-14: trang 1/2/3 khong trung nhau)
//   "rank:<n>"  bang xep hang qua API (1 周榜, 2 月榜, 3 年榜, 4 新作榜,
//       5 收藏榜) — 100 muc, 1 trang.
//
// Load: file config.js, file rate-limit.js, file safe-first.js (bookItem
// trong config.js dung safeFirst de lay phan tu dau tien an toan).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(query, page) {
    query = query || "";

    if (query.indexOf("rank:") === 0) {
        return Response.success(rankList(query.substring(5)), "");
    }

    rateLimitDelay("banshanren.com");
    var response = fetch(allUrl(query, page));
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");
    var doc = response.html();

    return Response.success(parseList(doc), nextPageNumber(doc));
}

function rankList(range) {
    rateLimitDelay("banshanren.com");
    var response = fetch(BASE_URL + "/api/rank", { queries: { range: String(range || "1") } });
    if (!response.ok) return [];
    var model = response.json().model || [];
    var items = [];
    for (var i = 0; i < model.length; i++) {
        var item = apiItem(model[i]);
        if (item.name) items.push(item);
    }
    return items;
}
