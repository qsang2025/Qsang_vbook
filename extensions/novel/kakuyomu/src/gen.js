// gen.js — Danh sach truyen tu __NEXT_DATA__ cua trang bang xep hang
// (execute(url, page) -> items, next). URL vao la URL ranking day du
// (tu home/genre): /rankings/<genre>/<period>?page=N&work_variation=long.
// page la so trang 1-based (chuoi, "" = trang 1). Moi trang 100 muc;
// du 100 muc thi tra next = so trang ke (chuoi). Thu tu truyen lay tu
// nodes cua connection rankedWorks(...) trong ROOT_QUERY (key chua tham
// so nen phai tim dong, khong doan truoc nguyen van).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute(url, page) {
    url = String(url === undefined || url === null ? "" : url).trim();
    if (!url) return Response.error("Không có đường dẫn danh sách.");
    var listUrl = normalizeKakuyomuUrl(url);
    var pageNum = 1;
    var pRaw = String(page === undefined || page === null ? "" : page).replace(/\s/g, "");
    if (pRaw !== "") {
        var pn = parseInt(pRaw, 10);
        if (!isNaN(pn) && pn >= 1) pageNum = pn;
    }
    // Bo tham so page cu neu URL vao da co, roi ghep ?page=<so trang 1-based>.
    var base = listUrl.replace(/([?&])page=\d+/g, "$1").replace(/[?&]$/, "");
    listUrl = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + pageNum;
    // Trang ranking doi work_variation (server redirect 307 neu thieu).
    if (listUrl.indexOf("work_variation=") === -1) {
        listUrl += "&work_variation=long";
    }

    var r = fetchKakuText(listUrl);
    if (r.error) return Response.error(r.error);
    var nd = extractNextData(r.text);
    var state = apolloState(nd);
    if (!state || !state.ROOT_QUERY) return Response.error("Không đọc được danh sách truyện.");
    var key = findConnectionKey(state.ROOT_QUERY, "rankedWorks(");
    if (!key) return Response.error("Không đọc được danh sách truyện.");
    var conn = state.ROOT_QUERY[key];
    var nodes = (conn && conn.nodes) || [];
    var items = [];
    var i = 0;
    for (i = 0; i < nodes.length; i++) {
        var ref = nodes[i] && nodes[i].__ref;
        if (!ref) continue;
        var work = state[ref];
        if (!work || !work.title || !work.id) continue;
        items.push(workItem(state, work));
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện trong danh sách này.");
    var next = "";
    if (nodes.length >= 100) next = String(pageNum + 1);
    return Response.success(items, next);
}
