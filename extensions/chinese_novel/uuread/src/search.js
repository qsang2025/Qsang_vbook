// search.js — uu看書 (uuread.tw): vua tim kiem vua lam script danh sach
// cho cac tab trang chu (home.js) va the loai (genre.js).
// `query` la tu khoa tim kiem, hoac duong dan danh sach (/sort/...,
// /full/...) khi duoc goi tu tab; `page` la URL trang ke (data2).
// Port tu alexsonxxx v1; sua quirk .first() (xem file safe-first.js:
// first() khong bao gio tra null tren may that — chuoi fallback cu
// `main ? ... : ...` khong bao gio chay) va them pacing + phat hien
// trang challenge Cloudflare (xem file config.js).
load('config.js');
load('rate-limit.js');
load('safe-first.js');
load('challenge-handler.js');

function execute(query, page) {
    query = query || "";
    page = page || "";

    var isUrl = function (s) {
        return s.indexOf("/") === 0 || s.indexOf("http") === 0;
    };

    var url;
    if (page && isUrl(page)) {
        url = page;
    } else if (query && isUrl(query)) {
        url = query;
    } else {
        var r = fetchDoc(BASE_URL + "/search", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "searchkey=" + encodeURIComponent(query) + "&searchtype=all"
        });
        if (!r.ok) return Response.error(httpError(BASE_URL + "/search", r.status, r.challenge, r.cooldownMs));
        var items = parseList(r.doc.select("ul.newlist li"));
        return Response.success(items, "");
    }

    if (url.indexOf("http") !== 0) url = BASE_URL + url;

    var r2 = fetchDoc(url);
    if (!r2.ok) return Response.error(httpError(url, r2.status, r2.challenge, r2.cooldownMs));
    var doc = r2.doc;

    var items = [];
    var seen = {};

    // cover cards ("推薦小說") carry the real cover image in the `srcset` attr
    doc.select(".index-body-nr-left-1-li").forEach(function (card) {
        var a = safeFirst(card.select(".media a"));
        if (!a) return;
        var href = a.attr("href");
        if (!href || seen[href]) return;
        seen[href] = true;
        var img = safeFirst(card.select("img"));
        var titleEl = safeFirst(card.select(".media-body strong a"));
        var authorEl = safeFirst(card.select(".media-body span a"));
        items.push({
            name: titleEl ? titleEl.text() : (a.attr("title") || ""),
            cover: img ? coverFrom(img) : "",
            link: href,
            host: BASE_URL,
            description: authorEl ? authorEl.text() : "",
            tag: ""
        });
    });

    // main paginated text list (no covers in markup)
    var main = safeFirst(doc.select(".sj-list .newlist"));
    var list = main ? main.select("li") : doc.select("ul.newlist li");
    list.forEach(function (el) {
        var nameEl = safeFirst(el.select(".newlist-title a"));
        if (!nameEl) return;
        var href = nameEl.attr("href");
        if (!href || seen[href]) return;
        seen[href] = true;
        var typeEl = safeFirst(el.select(".newlist-type"));
        var chapEl = safeFirst(el.select(".newlist-zj a"));
        var authorEl = safeFirst(el.select(".newlist-zz a"));
        items.push({
            name: nameEl.text(),
            cover: "",
            link: href,
            host: BASE_URL,
            description: chapEl ? chapEl.text() : "",
            tag: typeEl ? typeEl.text() : (authorEl ? authorEl.text() : "")
        });
    });

    var nextEl = safeFirst(doc.select(".pages .pagelink .next"));
    var next = nextEl ? nextEl.attr("href") : "";

    return Response.success(items, next || "");
}

// cover lives in `srcset` (lazy-loaded); fall back to `src`
function coverFrom(img) {
    var s = img.attr("srcset") || img.attr("src") || "";
    if (!s) return "";
    return s.split(",")[0].trim().split(" ")[0];
}

function parseList(rows) {
    var out = [];
    rows.forEach(function (el) {
        var nameEl = safeFirst(el.select(".newlist-title a"));
        if (!nameEl) return;
        var href = nameEl.attr("href");
        if (!href) return;
        var typeEl = safeFirst(el.select(".newlist-type"));
        var chapEl = safeFirst(el.select(".newlist-zj a"));
        var authorEl = safeFirst(el.select(".newlist-zz a"));
        out.push({
            name: nameEl.text(),
            cover: "",
            link: href,
            host: BASE_URL,
            description: chapEl ? chapEl.text() : "",
            tag: typeEl ? typeEl.text() : (authorEl ? authorEl.text() : "")
        });
    });
    return out;
}
