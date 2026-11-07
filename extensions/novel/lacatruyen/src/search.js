// search.js — Tim kiem truyen tren La Ca Truyen (/api/stories/get-search kem fallback /api/stories/search)
load('config.js');

var SEARCH_LIMIT = 20;

function postSearch(endpoint, payload, keyword) {
    try {
        var res = fetch(BASE_URL + endpoint, {
            method: "POST",
            headers: buildAuthHeaders({
                "Content-Type": "application/json",
                "Referer": BASE_URL + "/search?s=" + encodeURIComponent(keyword)
            }),
            body: JSON.stringify(payload)
        });
        if (!res || !res.ok) return null;
        return res.json();
    } catch (e) {
        return null;
    }
}

function formatSearchResponse(json, currentPage) {
    if (!json || !Array.isArray(json.data)) return null;
    var rows = json.data;
    var list = [];
    for (var i = 0; i < rows.length; i++) {
        var mapped = mapStoryItem(rows[i]);
        if (mapped && mapped.name && mapped.link) {
            list.push(mapped);
        }
    }
    var next = "";
    var total = parseInt(json.count || 0, 10);
    if (!isNaN(total) && total > 0) {
        if ((currentPage * SEARCH_LIMIT) < total) {
            next = String(currentPage + 1);
        }
    } else if (rows.length >= SEARCH_LIMIT) {
        next = String(currentPage + 1);
    }
    return Response.success(list, next);
}

function execute(key, page) {
    var keyword = String(key || "").trim();
    if (!keyword) return Response.success([], "");

    var currentPage = parseInt(page, 10);
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;

    var primaryJson = postSearch("/api/stories/get-search", {
        page: currentPage,
        items_per_page: SEARCH_LIMIT,
        search: keyword,
        sort_by: "updated"
    }, keyword);

    var primaryResult = formatSearchResponse(primaryJson, currentPage);
    if (primaryResult) return primaryResult;

    var fallbackJson = postSearch("/api/stories/search", {
        search: keyword,
        page: currentPage,
        limit: SEARCH_LIMIT
    }, keyword);

    var fallbackResult = formatSearchResponse(fallbackJson, currentPage);
    if (fallbackResult) return fallbackResult;

    return Response.error("Không thể tìm kiếm truyện trên La Cà Truyện.");
}
