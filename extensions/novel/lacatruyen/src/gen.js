// gen.js — Danh sach truyen theo tab trang chu hoac the loai La Ca Truyen
load('config.js');

var PAGE_SIZE = 20;

function extractCategorySlug(input) {
    var raw = String(input || "").trim();
    if (!raw) return "";
    var m = raw.match(/\/category\/([^/?#]+)/i);
    if (m && m[1]) return m[1];
    return "";
}

function mapRows(rows) {
    var list = [];
    if (!Array.isArray(rows)) return list;
    for (var i = 0; i < rows.length; i++) {
        var mapped = mapStoryItem(rows[i]);
        if (mapped && mapped.name && mapped.link) {
            list.push(mapped);
        }
    }
    return list;
}

function execute(url, page) {
    var currentPage = parseInt(page, 10);
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;

    var rawInput = String(url || "").trim();
    if (!rawInput) return Response.error("Đường dẫn danh mục không hợp lệ.");

    var catSlug = extractCategorySlug(rawInput);

    // 1. Truong hop the loai (/category/<slug>)
    if (catSlug) {
        var sortBy = getQueryParam(rawInput, "sort") || getQueryParam(rawInput, "sort_by") || "newest";
        var payload = {
            page: currentPage,
            items_per_page: PAGE_SIZE,
            slug: catSlug,
            sort_by: sortBy
        };

        var res = fetch(BASE_URL + "/api/categories/get-story", {
            method: "POST",
            headers: buildAuthHeaders({
                "Content-Type": "application/json",
                "Referer": BASE_URL + "/category/" + catSlug
            }),
            body: JSON.stringify(payload)
        });

        if (res && res.ok) {
            var json = null;
            try {
                json = res.json();
            } catch (e) {
            }
            if (json && Array.isArray(json.data)) {
                var list = mapRows(json.data);
                var total = parseInt(json.count || 0, 10);
                var next = "";
                if (!isNaN(total) && total > 0 && (currentPage * PAGE_SIZE) < total) {
                    next = String(currentPage + 1);
                } else if (json.data.length >= PAGE_SIZE) {
                    next = String(currentPage + 1);
                }
                return Response.success(list, next);
            }
        }

        // Fallback: doc __NEXT_DATA__ tu trang /category/<slug>
        var catUrl = BASE_URL + "/category/" + catSlug + (currentPage > 1 ? ("?page=" + currentPage) : "");
        var htmlRes = fetch(catUrl, {
            method: "GET",
            headers: buildAuthHeaders()
        });
        if (!htmlRes || !htmlRes.ok) {
            return Response.error("Không thể tải danh sách truyện theo thể loại.");
        }
        var nextData = extractNextData(htmlRes.html());
        var pageProps = (nextData && nextData.props && nextData.props.pageProps) ? nextData.props.pageProps : {};
        var rows = Array.isArray(pageProps.initialStories) ? pageProps.initialStories : [];
        var fbList = mapRows(rows);
        var fbTotal = parseInt(pageProps.initialCount || 0, 10);
        var fbNext = "";
        if (!isNaN(fbTotal) && fbTotal > 0 && (currentPage * PAGE_SIZE) < fbTotal) {
            fbNext = String(currentPage + 1);
        } else if (rows.length >= PAGE_SIZE) {
            fbNext = String(currentPage + 1);
        }
        return Response.success(fbList, fbNext);
    }

    // 2. Truong hop tab API danh sach (/api/stories/<tab>)
    var apiPath = stripQueryAndHash(rawInput);
    if (apiPath.indexOf("http") === 0) {
        apiPath = normalizeUrl(apiPath);
    } else {
        if (apiPath.charAt(0) !== "/") apiPath = "/" + apiPath;
        if (apiPath.indexOf("/api/") !== 0) apiPath = "/api/stories" + apiPath;
        apiPath = BASE_URL + apiPath;
    }

    var targetUrl = apiPath + "?page=" + currentPage + "&limit=" + PAGE_SIZE;
    var tabRes = fetch(targetUrl, {
        method: "GET",
        headers: buildAuthHeaders()
    });
    if (!tabRes || !tabRes.ok) {
        return Response.error("Không thể tải danh sách truyện từ máy chủ.");
    }

    var tabJson = null;
    try {
        tabJson = tabRes.json();
    } catch (e2) {
        return Response.error("Dữ liệu danh sách truyện không hợp lệ.");
    }

    var tabRows = (tabJson && Array.isArray(tabJson.data)) ? tabJson.data : [];
    var tabList = mapRows(tabRows);
    var tabNext = "";
    var pagination = (tabJson && tabJson.pagination) ? tabJson.pagination : null;
    var totalPages = pagination ? parseInt(pagination.totalPages || pagination.total_pages || 0, 10) : 0;
    var tabCount = parseInt((tabJson && tabJson.count) || (pagination && pagination.total) || 0, 10);

    if (!isNaN(totalPages) && totalPages > 0) {
        if (currentPage < totalPages) tabNext = String(currentPage + 1);
    } else if (!isNaN(tabCount) && tabCount > 0) {
        if ((currentPage * PAGE_SIZE) < tabCount) tabNext = String(currentPage + 1);
    } else if (tabRows.length >= PAGE_SIZE) {
        tabNext = String(currentPage + 1);
    }

    return Response.success(tabList, tabNext);
}
