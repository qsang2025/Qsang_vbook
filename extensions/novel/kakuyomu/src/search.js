// search.js — Tim kiem truyen tu __NEXT_DATA__ cua trang tim kiem
// (execute(keyword, page) -> items, next). Site tim qua /search?q=<tu khoa>,
// ket qua 20 muc/trang, phan trang ?page=N (offset (N-1)*20, server tu
// doi). Thu tu ket qua lay tu nodes cua connection searchWorks(...) trong
// ROOT_QUERY. Khac base khoa301020 v1: base tim qua API cua syosetu.com
// (tra truyen Narou, khong phai Kakuyomu) nen khong dung duoc.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute(keyword, page) {
    var kw = String(keyword === undefined || keyword === null ? "" : keyword).trim();
    if (!kw) return Response.error("Nhập từ khóa tìm kiếm.");
    var pageNum = 1;
    var pRaw = String(page === undefined || page === null ? "" : page).replace(/\s/g, "");
    if (pRaw !== "") {
        var pn = parseInt(pRaw, 10);
        if (!isNaN(pn) && pn >= 1) pageNum = pn;
    }
    var searchUrl = BASE_URL + "/search?q=" + encodeURIComponent(kw) + "&page=" + pageNum;
    var r = fetchKakuText(searchUrl);
    if (r.error) return Response.error(r.error);
    var nd = extractNextData(r.text);
    var state = apolloState(nd);
    if (!state || !state.ROOT_QUERY) return Response.error("Không tìm thấy kết quả.");
    var key = findConnectionKey(state.ROOT_QUERY, "searchWorks(");
    if (!key) return Response.error("Không tìm thấy kết quả.");
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
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa này.");
    var next = "";
    if (nodes.length >= 20) next = String(pageNum + 1);
    return Response.success(items, next);
}
