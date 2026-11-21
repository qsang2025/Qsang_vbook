// helper.js — ham dung chung cua extension HH3D (hh3d.ad).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : siteOrigin();
}

function unwrapCover(src) {
    var s = String(src === undefined || src === null ? "" : src).replace(/^\s+|\s+$/g, "");
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    return absUrl(s);
}

function isFilmDetailPath(path) {
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return false;
    if (/^\/(popular-tag|hoan-thanh|lich-chieu|phim-le|the-loai|wp-content|wp-admin|wp-includes|page|feed|author|tag|category)\b/i.test(path)) {
        return false;
    }
    return true;
}

function parseFilmCard(el) {
    if (!el) return null;
    var a = el;
    var href = String(a.attr("href") || "");
    if (!href) {
        var innerA = safeFirst(el.select("a[href]"));
        if (innerA !== null) {
            a = innerA;
            href = String(a.attr("href") || "");
        }
    }
    if (!href) return null;
    var link = absUrl(href).replace(/\/+$/, "") + "/";
    var path = link.replace(/^https?:\/\/[^\/]+/i, "");
    if (!isFilmDetailPath(path)) return null;

    var name = "";
    var titleEl = safeFirst(el.select("h3.movie-title, h3, .movie-title"));
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) name = cleanText(a.attr("title"));

    var img = safeFirst(el.select("img"));
    if (!name && img !== null) name = cleanText(img.attr("alt"));
    if (!name) return null;

    var cover = "";
    if (img !== null) {
        cover = unwrapCover(img.attr("data-src") || img.attr("data-original") || img.attr("src"));
    }

    var tag = "";
    var badge = safeFirst(el.select(".episode-badge"));
    if (badge !== null) tag = cleanText(badge.text());

    var desc = "";
    var orig = safeFirst(el.select("p.movie-original-title, .movie-original-title"));
    if (orig !== null) desc = cleanText(orig.text());

    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

function buildPagedUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return url;
    var raw = String(url || "");
    if (raw.indexOf("?s=") !== -1 || raw.indexOf("&s=") !== -1) {
        if (raw.indexOf("paged=") !== -1) return raw.replace(/([?&])paged=\d+/, "$1paged=" + n);
        return raw + (raw.indexOf("?") === -1 ? "?" : "&") + "paged=" + n;
    }
    var clean = raw.replace(/\/page\/\d+\/?$/, "/").replace(/\/+$/, "");
    return clean + "/page/" + n + "/";
}

function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    var cards = doc.select("a.movie-card-update1");
    if (cards.size() === 0) cards = doc.select(".movie-item a[href]");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseFilmCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }

    var hasNext = false;
    var nextNum = cur + 1;
    var nextLink = safeFirst(doc.select("a.next.page-numbers, a[href*='/page/" + nextNum + "'], a[href*='paged=" + nextNum + "']"));
    if (nextLink !== null) {
        hasNext = true;
    }
    return { items: items, next: hasNext ? String(nextNum) : "" };
}

function episodeNumber(s) {
    var m = String(s || "").match(/tap-(\d+)/i);
    if (!m) m = String(s || "").match(/Tập\s*(\d+)/i);
    if (!m) m = String(s || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function watchSlugAndEp(watchUrl) {
    var u = String(watchUrl || "");
    var m = u.match(/\/([^\/]+)\/tap-(\d+)/i);
    if (m) return { slug: m[1], ep: parseInt(m[2], 10) };
    return { slug: "", ep: 0 };
}
