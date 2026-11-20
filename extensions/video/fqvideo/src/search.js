// search.js — tim kiem tu khoa + duyet BXH / danh muc cho tab home & genre.
// Che do 1 (duong dan "/" hoac "http"): tai trang SSR /rank/... hoac /category/...
//   tren hongguoduanju.com, phan tich _ROUTER_DATA (rankList / recommendList).
// Che do 2 (tu khoa 1-30 ky tu): goi GET /api/search/result?query=<q>&page=<N>
//   voi header Referer: .../search.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function buildBrowseUrl(query, pageNum) {
    var base = query.indexOf("http") === 0 ? query : videoBaseUrl() + query;
    if (/^https?:\/\/(?:[^\/]+\.)?hongguoduanju\.com/i.test(base)) {
        base = base.replace(/^https?:\/\/[^\/]+/i, videoOrigin());
    }
    base = base.replace(/([?&])page=\d+&?/i, "$1").replace(/[?&]$/, "");
    if (pageNum > 1) {
        base = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + pageNum;
    }
    return base;
}

function dedupeItems(rawList, mapper) {
    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < rawList.length; i++) {
        var mapped = mapper(rawList[i]);
        if (!mapped || !mapped.link || seen[mapped.link]) continue;
        seen[mapped.link] = true;
        items.push(mapped);
    }
    return items;
}

function browseList(query, pageNum) {
    var url = buildBrowseUrl(query, pageNum);
    var r = fqFetchHtml(url, videoBaseUrl() + "/", "Không tải được danh sách phim");
    if (!r.ok) return Response.error(r.error);

    var rd = extractRouterData(r.text);
    if (!rd) {
        return Response.error("Không đọc được dữ liệu danh sách phim (cấu trúc trang có thể đã thay đổi).");
    }

    var rank = findRankContent(rd);
    if (rank) {
        var rankItems = dedupeItems(rank.rankList || [], mapRankItem);
        var rp = rank.pagination || {};
        var rCur = parseInt(rp.pageNum, 10) || pageNum;
        var rTot = parseInt(rp.totalPages, 10) || 0;
        var rNext = (rankItems.length > 0 && rTot > rCur) ? String(rCur + 1) : "";
        return Response.success(rankItems, rNext);
    }

    var cat = findCategoryContent(rd);
    if (cat) {
        var catItems = dedupeItems(cat.recommendList || [], mapCategoryItem);
        var cp = cat.pagination || {};
        var cCur = parseInt(cp.pageNum, 10) || pageNum;
        var cTot = parseInt(cp.totalPages, 10) || 0;
        var cNext = (catItems.length > 0 && cTot > cCur) ? String(cCur + 1) : "";
        return Response.success(catItems, cNext);
    }

    return Response.error("Không tìm thấy danh sách phim hợp lệ trên trang này.");
}

function searchKeyword(query, pageNum) {
    if (query.length > 30) {
        return Response.error("Từ khóa tìm kiếm tối đa 30 ký tự (giới hạn API FQ Video). Vui lòng rút gọn từ khóa.");
    }
    var url = videoBaseUrl() + "/api/search/result?query=" + encodeURIComponent(query);
    if (pageNum > 1) url = url + "&page=" + pageNum;

    var r = fqFetchJson(url, {
        referer: videoBaseUrl() + "/search",
        allowMirrors: true
    }, "Không tìm kiếm được trên FQ Video");
    if (!r.ok) return Response.error(r.error);

    var data = r.json || {};
    var list = data.searchList instanceof Array ? data.searchList : [];
    var items = dedupeItems(list, mapSearchItem);

    var cur = parseInt(data.pageNum, 10) || pageNum;
    var totalPages = parseInt(data.totalPages, 10) || 0;
    var hasMore = data.hasMore === true || (totalPages > 0 && cur < totalPages);
    var next = (items.length > 0 && hasMore) ? String(cur + 1) : "";
    return Response.success(items, next);
}

function execute(query, page) {
    var q = cleanText(query || "");
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    if (!q) return Response.error("Vui lòng nhập từ khóa để tìm kiếm.");

    if (q.indexOf("/") === 0 || /^https?:\/\//i.test(q)) {
        return browseList(q, pageNum);
    }
    return searchKeyword(q, pageNum);
}
