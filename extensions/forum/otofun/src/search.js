// search.js — danh sach thread + tim kiem tu khoa (Otofun, XenForo).
//
// Hai che do:
// 1. Duyet danh sach: query bat dau bang "/" hoac "http" (tab home.js /
//    muc genre.js truyen duong dan chuyen muc). GET trang do, doc cac
//    .structItem.structItem--thread. Phan trang danh sach dung ?page=N.
//    Thread ghim (sticky) chi hien o trang 1 — tu trang 2 tro di bo qua
//    de khoi trung lap (XenForo lap lai thread ghim tren moi trang).
// 2. Tim kiem tu khoa: XenForo KHONG co tim kiem GET (/search?q= tra 0 ket
//    qua). Phai POST: GET /search/ lay token _xfToken, POST /search/search
//    (keywords + _xfToken), theo redirect toi trang ket qua /search/<id>/,
//    doc cac .block-row. Phan trang ket qua dung ?page=N tren URL ket qua.
//
// Bam vao thread thi mo thang reader (posts.js), khong qua trang detail.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";

    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        return listThreads(query, page);
    }
    if (query === "") {
        return listThreads("/whats-new/posts/", page);
    }
    return searchKeyword(query, page);
}

// --- Che do 1: duyet danh sach thread ---
function listThreads(query, page) {
    var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
    var url = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");
    var doc = response.html();

    // Ten board (chi co khi duyet mot board /forums/...; trang whats-new
    // khong co board rieng nen de trong).
    var boardName = "";
    if (url.indexOf("/forums/") !== -1) {
        boardName = doc.select(".p-title-value").text();
    }

    var pageNum = parseInt(page);
    var items = [];
    doc.select(".structItem.structItem--thread").map(function (el) {
        var pinned = !el.select(".structItem-status--sticky").isEmpty();
        // Thread ghim lap lai tren moi trang — tu trang 2 bo qua.
        if (pageNum > 1 && pinned) return null;

        var titleLink = el.select(".structItem-title a[href*=\"/threads/\"]");
        var timeEl = el.select(".structItem-startDate time");
        var timeText = timeEl.attr("title");
        if (!timeText) timeText = timeEl.text();
        var author = el.select(".structItem-parts a.username").text();
        if (!author) author = el.attr("data-author");
        var meta = el.select(".structItem-cell--meta dl.pairs dd");

        items.push({
            name: titleLink.text(),
            link: toAbs(titleLink.attr("href")),
            author: author,
            time: timeText,
            replies: meta.first() ? meta.first().text() : "",
            views: meta.last() ? meta.last().text() : "",
            board: boardName,
            pinned: pinned,
            locked: !el.select(".structItem-status--locked").isEmpty()
        });
        return null;
    });

    var hasNext = !doc.select(".pageNav-page--later").isEmpty();
    return Response.success(items, hasNext ? String(pageNum + 1) : "");
}

// --- Che do 2: tim kiem tu khoa bang POST ---
// XenForo doi token CSRF moi lan tim; token doi khi het han (400) nen
// thu lai 1 lan voi token moi truoc khi bao loi.
function searchKeyword(query, page) {
    var res = doSearchPost(query);
    if (!res.ok && res.status === 400) {
        res = doSearchPost(query);
    }
    if (!res.ok) return Response.error("Tìm kiếm thất bại (HTTP " + res.status + ")");
    var resultsUrl = res.url || "";
    if (resultsUrl.indexOf("/search/") === -1) {
        return Response.error("Tìm kiếm thất bại, thử lại sau");
    }

    // Trang 1 lay tu POST; trang sau GET lai URL ket qua + ?page=N.
    var doc = null;
    if (page === "1") {
        doc = res.html();
    } else {
        var pageRes = fetch(resultsUrl + "&page=" + page);
        if (!pageRes.ok) return Response.error("Không tải được trang kết quả (HTTP " + pageRes.status + ")");
        doc = pageRes.html();
    }

    var items = [];
    doc.select(".block-row").map(function (el) {
        var titleLink = el.select(".contentRow-title a");
        var href = titleLink.attr("href");
        // Link ket qua tro toi mot bai cu the (/post-...); cat ve URL thread.
        href = href.replace(/\/post-\d+.*$/, "");
        var timeEl = el.select(".contentRow-minor time");
        var timeText = timeEl.attr("title");
        if (!timeText) timeText = timeEl.text();
        var boardLink = el.select(".contentRow-minor a[href*=\"/forums/\"]");
        var avatar = el.select(".contentRow-figure img").attr("src");

        items.push({
            name: titleLink.text(),
            link: toAbs(href),
            author: el.select(".contentRow-minor .username").text(),
            avatar: avatar ? toAbs(avatar) : "",
            time: timeText,
            description: el.select(".contentRow-snippet").text(),
            board: boardLink.text()
        });
        return null;
    });

    var hasNext = !doc.select(".pageNav-page--later").isEmpty();
    return Response.success(items, hasNext ? String(parseInt(page) + 1) : "");
}

// Mot lan tim kiem: GET /search/ lay token _xfToken, POST /search/search.
function doSearchPost(query) {
    var formDoc = fetch(BASE_URL + "/search/").html();
    var token = formDoc.select("input[name=\"_xfToken\"]").attr("value");
    if (!token) return { ok: false, status: 0, url: "", html: function () { return null; } };
    return fetch(BASE_URL + "/search/search", {
        method: "POST",
        body: {
            keywords: query,
            _xfToken: token,
            search_type: "post",
            order: "date"
        }
    });
}
