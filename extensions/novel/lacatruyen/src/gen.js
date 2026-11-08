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

// API list cua La Ca Truyen khong tra count/pagination, server lai bo qua ca page lan limit —
// khong the biet con trang sau hay khong dua vao so item (vd: tab "Moi cap nhat" chi tra
// 12 item nhung page 2 van co du lieu; nguoc lai tab top-view 20 item thi page 2 tra ve
// Y HET 20 item cua page 1). Probe thang trang ke va so sanh item.
// LUU Y: list "moi cap nhat" rat bien dong — 2 request lien tiep cung page 1 da lech nhau
// 2-3 item — nen chi ket luan co trang sau khi DA SO item o trang ke la moi; 1-2 item moi
// chi la do list xao tron giua 2 request, khong phai trang sau that.
function hasNextTabPage(apiPath, currentPage, currentRows) {
    try {
        var probeUrl = apiPath + "?page=" + (currentPage + 1) + "&limit=" + PAGE_SIZE;
        var probeRes = fetch(probeUrl, {
            method: "GET",
            headers: buildAuthHeaders()
        });
        if (!probeRes || !probeRes.ok) return false;
        var probeJson = probeRes.json();
        var probeRows = (probeJson && Array.isArray(probeJson.data)) ? probeJson.data : [];
        if (probeRows.length === 0) return false;
        var seen = {};
        for (var i = 0; i < currentRows.length; i++) {
            var m = mapStoryItem(currentRows[i]);
            if (m && m.link) seen[m.link] = true;
        }
        var newCount = 0;
        for (var j = 0; j < probeRows.length; j++) {
            var pm = mapStoryItem(probeRows[j]);
            if (pm && pm.link && !seen[pm.link]) newCount++;
        }
        return newCount * 2 > probeRows.length;
    } catch (e) {
        return false;
    }
}

function execute(url, page) {
    var currentPage = parseInt(page, 10);
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;

    var rawInput = String(url || "").trim();
    if (!rawInput) return Response.error("Đường dẫn danh mục không hợp lệ.");

    // 0. Truong hop truyen tuong tu (/api/stories/similar?story_id=<id>) — tu chip suggests o detail.js
    var similarId = getQueryParam(rawInput, "story_id");
    if (similarId && rawInput.indexOf("similar") !== -1) {
        var simUrl = BASE_URL + "/api/stories/similar?story_id=" + encodeURIComponent(similarId) + "&limit=" + PAGE_SIZE + "&page=" + currentPage;
        var simRes = null;
        try {
            simRes = fetch(simUrl, {
                method: "GET",
                headers: buildAuthHeaders()
            });
        } catch (eSim) {
            return Response.error("Không thể tải danh sách truyện cùng thể loại (lỗi mạng).");
        }
        if (!simRes || !simRes.ok) {
            return Response.error("Không thể tải danh sách truyện cùng thể loại.");
        }
        var simJson = null;
        try {
            simJson = simRes.json();
        } catch (eSimJson) {
            return Response.error("Dữ liệu truyện cùng thể loại không hợp lệ.");
        }
        var simRows = (simJson && Array.isArray(simJson.data)) ? simJson.data : [];
        var simList = mapRows(simRows);
        // Similar la danh sach goi y co dinh (API bo qua page — goi page=2 tra ve y het 20 item
        // cua page 1, chi xao tron chut it) nen khong phan trang, tra het 1 lan.
        return Response.success(simList, "");
    }

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

        var res = null;
        try {
            res = fetch(BASE_URL + "/api/categories/get-story", {
                method: "POST",
                headers: buildAuthHeaders({
                    "Content-Type": "application/json",
                    "Referer": BASE_URL + "/category/" + catSlug
                }),
                body: JSON.stringify(payload)
            });
        } catch (ePost) {
            res = null;
        }

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
        var htmlRes = null;
        try {
            htmlRes = fetch(catUrl, {
                method: "GET",
                headers: buildAuthHeaders()
            });
        } catch (eHtml) {
            return Response.error("Không thể tải danh sách truyện theo thể loại (lỗi mạng).");
        }
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
    // Chi nhan dung duong dan /api/stories/<tab> (tu home.js) hoac URL day du chua /api/stories/;
    // input la (vd: chuoi JSON) thi bao loi thay vi tu che URL rac "/api/stories" + input.
    var apiPath = stripQueryAndHash(rawInput);
    if (apiPath.indexOf("http") === 0) {
        apiPath = normalizeUrl(apiPath);
        if (apiPath.indexOf("/api/stories/") === -1) {
            return Response.error("Đường dẫn danh mục không hợp lệ.");
        }
    } else {
        if (apiPath.charAt(0) !== "/") apiPath = "/" + apiPath;
        if (apiPath.indexOf("/api/stories/") !== 0) {
            return Response.error("Đường dẫn danh mục không hợp lệ.");
        }
        apiPath = BASE_URL + apiPath;
    }

    var targetUrl = apiPath + "?page=" + currentPage + "&limit=" + PAGE_SIZE;
    var tabRes = null;
    try {
        tabRes = fetch(targetUrl, {
            method: "GET",
            headers: buildAuthHeaders()
        });
    } catch (eTab) {
        return Response.error("Không thể tải danh sách truyện từ máy chủ (lỗi mạng).");
    }
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
    } else {
        // Khong co count/pagination: khong the suy ra con trang sau tu so item (server bo qua
        // ca page lan limit — tab 20 item thi page 2 tra ve y het page 1). Probe trang ke.
        if (hasNextTabPage(apiPath, currentPage, tabRows)) {
            tabNext = String(currentPage + 1);
        }
    }

    return Response.success(tabList, tabNext);
}
