// gen.js — list script dung chung cho tab trang chu, the loai va muc
// "cung tac gia" o trang chi tiet. Hai che do (kiem chung live 2026-11-12):
//
// 1. API (tab /tim-truyen?sort=... , /xep-hang/... , URL /api/search-novels
//    hoac tu khoa don): GET /api/search-novels?sort|keyword|page — tra JSON
//    {novels: [...], page, total_pages}, 20 truyen/trang. Tham so sort da
//    kiem chung doi thu tu ket qua (update, view-weekly, view-monthly,
//    push-weekly, push-monthly, ban-chay); rieng sort=chi-so-doc tra ve
//    dung thu tu mac dinh — co the API bo qua, xem README.
// 2. HTML (input /the-loai/<slug>): API BO QUA tham so genre (tra ve dung
//    danh sach mac dinh) nen phai doc trang HTML cua the loai — trang nay
//    render san 20 truyen (article.novel-card) + phan trang ?page=N.
//
// Trang 1 goi execute(input, ""); cac trang sau goi execute(input, "N").
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load("config.js");
load("rate-limit.js");

function parseApiList(json, curPage) {
    if (!json) return { books: [], nextPage: "" };
    var dataArr = json.novels || json.data || json.items || (Array.isArray(json) ? json : []);
    var books = [];
    for (var b = 0; b < dataArr.length; b++) {
        var bk = toBook(dataArr[b]);
        if (bk && bk.name && bk.link) books.push(bk);
    }
    var nextPage = "";
    var current = json.page || json.current_page || curPage;
    var last = json.total_pages || json.last_page;
    if (last && current < last) {
        nextPage = String(current + 1);
    } else if (books.length >= 20) {
        nextPage = String(curPage + 1);
    }
    return { books: books, nextPage: nextPage };
}

function executeApiList(apiUrl, curPage) {
    var r = pacedFetch(apiUrl, {
        headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json, text/plain, */*" }
    });
    if (!r.ok) {
        if (r.status === 429 || r.status === 405) {
            return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(apiUrl), r.cooldownRemainingMs));
        }
        if (r.status) return Response.error("Không tải được danh sách (HTTP " + r.status + ").");
        return Response.error("Không tải được danh sách (lỗi mạng).");
    }
    var json = null;
    try {
        json = r.res.json();
    } catch (e) {
        json = null;
    }
    if (!json) return Response.success([]);
    var out = parseApiList(json, curPage);
    return Response.success(out.books, out.nextPage);
}

function executeHtmlList(pageUrl, curPage) {
    var res = fetchPage(pageUrl);
    if (!res || !res.ok) {
        if (res && (res.status === 429 || res.status === 405)) {
            return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(pageUrl), cooldownRemainingMs(pacedHostOf(pageUrl))));
        }
        if (res && res.status) return Response.error("Không tải được danh sách (HTTP " + res.status + ").");
        return Response.error("Không tải được danh sách (lỗi mạng).");
    }
    var doc = res.html();
    if (!doc) return Response.success([]);
    var books = [];
    var cards = doc.select("article.novel-card");
    cards.forEach(function (card) {
        var linkEl = safeFirst(card.select("a[href^='/truyen/']"));
        if (!linkEl) return;
        var href = linkEl.attr("href") + "";
        var titleEl = safeFirst(card.select("h3[itemprop='name']"));
        var name = titleEl ? cleanText(titleEl.text() + "") : cleanText(linkEl.attr("title") + "");
        if (!name) return;
        var coverEl = safeFirst(card.select("img.novel-cover"));
        var cover = coverEl ? normalizeCoverUrl(coverEl.attr("src") + "") : "";
        var badgeEl = safeFirst(card.select("div.absolute span"));
        var desc = badgeEl ? cleanText(badgeEl.text() + "") : "";
        books.push({
            name: name,
            link: toAbs(href),
            cover: cover,
            description: desc,
            host: BASE_ORIGIN
        });
    });
    var nextPage = "";
    var nextLink = safeFirst(doc.select("a[href*='page=" + (curPage + 1) + "']"));
    if (nextLink) {
        nextPage = String(curPage + 1);
    }
    return Response.success(books, nextPage);
}

function execute(url, page) {
    var curPage = parseInt(page || "1", 10);
    if (isNaN(curPage) || curPage < 1) curPage = 1;
    var input = String(url || "").trim();

    // Che do HTML: trang the loai (API bo qua tham so genre).
    if (input.indexOf("/the-loai/") >= 0) {
        var pageUrl = normalizeUrl(input);
        var sep = pageUrl.indexOf("?") >= 0 ? "&" : "?";
        pageUrl = pageUrl + sep + "page=" + curPage;
        return executeHtmlList(pageUrl, curPage);
    }

    // Che do API: URL API day du (vd. muc tac gia o trang chi tiet).
    if (input.indexOf("/api/search-novels") >= 0) {
        var apiUrl = normalizeUrl(input);
        apiUrl = apiUrl.replace(/([?&])page=\d+/i, "$1page=" + curPage);
        if (apiUrl.indexOf("page=") < 0) {
            apiUrl += (apiUrl.indexOf("?") >= 0 ? "&" : "?") + "page=" + curPage;
        }
        return executeApiList(apiUrl, curPage);
    }

    // Tu khoa don (khong co "/" va khong co "http"): tim theo tu khoa.
    if (input && input.indexOf("/") < 0 && input.indexOf("http") < 0 && input.indexOf("webtruyendich.com") < 0) {
        return executeApiList(BASE_URL + "/api/search-novels?keyword=" + encodeURIComponent(input) + "&page=" + curPage, curPage);
    }

    // Tab trang chu / xep hang: trich sort tu query hoac tu duong dan.
    var params = {};
    var qIndex = input.indexOf("?");
    if (qIndex >= 0) {
        var pairs = input.substring(qIndex + 1).split("&");
        for (var i = 0; i < pairs.length; i++) {
            var parts = pairs[i].split("=");
            if (parts[0]) params[parts[0]] = decodeURIComponent(parts[1] || "");
        }
    }
    var path = qIndex >= 0 ? input.substring(0, qIndex) : input;
    if (path.indexOf("/xep-hang/") >= 0) {
        var rankSlug = path.split("/xep-hang/")[1];
        if (rankSlug) params.sort = rankSlug;
    }
    params.page = String(curPage);
    var queryArr = [];
    for (var k in params) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
            queryArr.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
        }
    }
    return executeApiList(BASE_URL + "/api/search-novels?" + queryArr.join("&"), curPage);
}
