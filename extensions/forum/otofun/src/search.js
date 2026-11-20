// search.js — danh sach thread + tim kiem tu khoa (Otofun, XenForo).
//
// Hai che do:
// 1. Duyet danh sach: query bat dau bang "/" hoac "http" (tab home.js /
//    muc genre.js truyen duong dan chuyen muc). GET trang do, doc cac
//    .structItem.structItem--thread. Phan trang danh sach dung ?page=N.
//    Thread ghim (sticky) chi hien o trang 1 — tu trang 2 tro di bo qua
//    de khoi trung lap (XenForo lap lai thread ghim tren moi trang).
// 2. Tim kiem tu khoa: XenForo KHONG co tim kiem GET (/search?q= tra 0 ket
//    qua). Phai POST: GET /search/ lay token _xfToken + cookie xf_csrf,
//    POST /search/search (keywords + _xfToken, kem Cookie xf_csrf), theo
//    redirect toi trang ket qua /search/<id>/, doc cac .block-row. Phan
//    trang ket qua dung ?page=N tren URL ket qua. Token gan voi cookie
//    xf_csrf cua cung session: POST khong kem cookie nay tra 400 — GET
//    chay qua pacedFetch (file rate-limit.js) de doc Set-Cookie qua
//    res.headers.get (mau sangtacvietapp/src/chap.js extractReadContextId).
//    Neu khong doc duoc cookie thi KHONG POST mu ma bao loi ro.
//
// Bam vao thread thi mo thang reader (posts.js), khong qua trang detail.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');

var NO_COOKIE_MSG = "Không lấy được cookie tìm kiếm (xf_csrf) nên không gửi tìm kiếm được. Hãy thử lại sau — nếu vẫn lỗi, tìm kiếm từ khóa sẽ bị bỏ, chỉ giữ duyệt board và đọc thread.";

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
// thu lai 1 lan voi token moi truoc khi bao loi. Neu khong doc duoc
// cookie xf_csrf thi bao loi ro ngay, khong POST mu.
function searchKeyword(query, page) {
    var res = doSearchPost(query);
    if (!res.ok && res.noCookie) return Response.error(NO_COOKIE_MSG);
    if (!res.ok && res.error === "cooldown") return Response.error(rateLimitErrorMessage("Otofun", "www.otofun.net.vn", res.cooldownMs));
    if (!res.ok && res.status === 400) {
        res = doSearchPost(query);
        if (!res.ok && res.noCookie) return Response.error(NO_COOKIE_MSG);
        if (!res.ok && res.error === "cooldown") return Response.error(rateLimitErrorMessage("Otofun", "www.otofun.net.vn", res.cooldownMs));
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

// Mot lan tim kiem: GET /search/ lay token _xfToken + cookie xf_csrf,
// POST /search/search. XenForo gan _xfToken voi cookie xf_csrf cua cung
// session: POST khong kem cookie nay tra 400 (tai hien bang curl tu VM:
// khong cookie -> 400; kem xf_csrf cung session -> 303 ve trang ket qua,
// GET lai trang ket qua tra 200, 20 ket qua). Runtime app khong tu mang
// cookie tu GET sang POST, nen GET chay qua pacedFetch (file rate-limit.js)
// de doc Set-Cookie qua res.headers.get — mau sangtacvietapp/src/chap.js
// extractReadContextId (da chay that tren may Anh). Neu khong doc duoc
// cookie thi tra co noCookie, KHONG POST mu.
function doSearchPost(query) {
    var pf = pacedFetch(BASE_URL + "/search/");
    if (!pf.ok) return { ok: false, status: pf.status, error: pf.error, cooldownMs: pf.cooldownRemainingMs, noCookie: false, url: "", html: function () { return null; } };
    var formRes = pf.res;
    var formDoc = formRes.html();
    var token = formDoc.select("input[name=\"_xfToken\"]").attr("value");
    if (!token) return { ok: false, status: 0, error: null, cooldownMs: 0, noCookie: false, url: "", html: function () { return null; } };
    var csrf = getSearchCsrf(formRes);
    if (!csrf) return { ok: false, status: 0, error: null, cooldownMs: 0, noCookie: true, url: "", html: function () { return null; } };
    return fetch(BASE_URL + "/search/search", {
        method: "POST",
        headers: {
            "Referer": BASE_URL + "/search/",
            "Cookie": "xf_csrf=" + csrf
        },
        body: {
            keywords: query,
            _xfToken: token,
            search_type: "post",
            order: "date"
        }
    });
}

// Doc gia tri cookie xf_csrf vua duoc server set khi GET /search/.
// Thu tu (mau sangtacvietapp/src/chap.js extractReadContextId, da chay that
// tren may Anh): (1) res.headers.get("Set-Cookie") — accessor Headers cua
// runtime; (2) quet key "set-cookie" trong res.headers (neu headers la
// object thuong); (3) formRes.header("set-cookie") — accessor cu; (4) jar
// cookie cua app (localCookie) neu GET da luu Set-Cookie vao do. Tra ""
// neu khong doc duoc — khi do doSearchPost KHONG POST mu ma bao loi ro.
function getSearchCsrf(formRes) {
    var cookieStr = "";
    try {
        if (formRes && formRes.headers) {
            if (typeof formRes.headers.get === "function") {
                cookieStr = formRes.headers.get("Set-Cookie") || formRes.headers.get("set-cookie") || "";
            }
            if (!cookieStr) {
                for (var k in formRes.headers) {
                    if (k.toLowerCase() === "set-cookie") {
                        var val = formRes.headers[k];
                        if (val) cookieStr += (typeof val === "string" ? val : (val.join ? val.join("; ") : String(val))) + "; ";
                    }
                }
            }
        }
    } catch (e) {
    }
    if (!cookieStr) {
        try {
            var sc = formRes.header("set-cookie");
            if (sc) cookieStr = sc;
        } catch (e2) {
        }
    }
    if (cookieStr) {
        var m = cookieStr.match(/xf_csrf=([^;,\s]+)/i);
        if (m) return m[1];
    }
    try {
        var jar = localCookie.getCookie();
        if (jar) {
            var m2 = jar.match(/xf_csrf=([^;,\s]+)/i);
            if (m2) return m2[1];
        }
    } catch (e3) {
    }
    return "";
}
