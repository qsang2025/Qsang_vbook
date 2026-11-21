// helper.js — ham dung chung cua extension HHTQ IO (hhtq.io).
// Gom ca resolveStreamrptPlayer / resolveFbPlayer (tu yanhh3d/src/helper.js)
// de giai embed yanhh3d.blog/sever2/... thanh link Native HLS/MP4.
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

function toDetailUrl(url) {
    var u = absUrl(url);
    var m = u.match(/\/xem\/([^\/\?#]+)/i);
    if (m) return siteOrigin() + "/phim/" + m[1];
    var pm = u.match(/\/phim\/([^\/\?#]+)/i);
    if (pm) return siteOrigin() + "/phim/" + pm[1];
    return u;
}

function parseFilmCard(el) {
    if (!el) return null;
    var a = el;
    var href = String(a.attr("href") || "");
    if (!href || href.indexOf("/phim/") === -1) {
        var innerA = safeFirst(el.select("a[href*='/phim/']"));
        if (innerA !== null) {
            a = innerA;
            href = String(a.attr("href") || "");
        }
    }
    if (!href || href.indexOf("/phim/") === -1) return null;

    var link = absUrl(href).replace(/\/+$/, "");
    var name = "";
    var titleEl = safeFirst(el.select("h3, h4, .film-title, .card-title, .title"));
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) name = cleanText(a.attr("title"));

    var img = safeFirst(el.select("img"));
    if (!name && img !== null) {
        name = cleanText(img.attr("alt")).replace(/^Poster\s+/i, "");
    }
    if (!name) name = cleanText(a.text());
    if (!name) return null;

    var cover = "";
    if (img !== null) {
        cover = unwrapCover(img.attr("data-src") || img.attr("data-original") || img.attr("src"));
    }

    var tag = "";
    var badge = safeFirst(el.select(".badge, .ep-badge, .film-ep, .status"));
    if (badge !== null) tag = cleanText(badge.text());

    return {
        name: name,
        cover: cover,
        link: link,
        description: "",
        tag: tag,
        host: siteOrigin()
    };
}

function buildPagedUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return url;
    var raw = String(url || "");
    if (raw.indexOf("page=") !== -1) return raw.replace(/([?&])page=\d+/, "$1page=" + n);
    return raw + (raw.indexOf("?") === -1 ? "?" : "&") + "page=" + n;
}

function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    var cards = doc.select("a.card.film-card[href*='/phim/']");
    if (cards.size() === 0) cards = doc.select(".film-card, .schedule-card");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseFilmCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }

    var nextNum = cur + 1;
    var hasNext = false;
    var nextLink = safeFirst(doc.select("a[href*='page=" + nextNum + "']"));
    if (nextLink !== null) hasNext = true;
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
    var m = u.match(/\/xem\/([^\/\?#]+)\/tap-(\d+)/i);
    if (m) return { slug: m[1], ep: parseInt(m[2], 10) };
    m = u.match(/\/sever2\/([^\/\?#]+)\/tap-(\d+)/i);
    if (m) return { slug: m[1], ep: parseInt(m[2], 10) };
    m = u.match(/\/([^\/\?#]+)\/tap-(\d+)/i);
    if (m) return { slug: m[1], ep: parseInt(m[2], 10) };
    return { slug: "", ep: 0 };
}

function b64decodeToString(b64) {
    var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var clean = String(b64 || "").replace(/[^A-Za-z0-9+\/=]/g, "");
    var out = "";
    var i = 0;
    while (i < clean.length) {
        var c1 = alpha.indexOf(clean.charAt(i++));
        var c2 = alpha.indexOf(clean.charAt(i++));
        var c3 = alpha.indexOf(clean.charAt(i++));
        var c4 = alpha.indexOf(clean.charAt(i++));
        if (c1 < 0 || c2 < 0) break;
        var n1 = (c1 << 2) | (c2 >> 4);
        out += String.fromCharCode(n1);
        if (c3 >= 0) {
            var n2 = ((c2 & 15) << 4) | (c3 >> 2);
            out += String.fromCharCode(n2);
        }
        if (c4 >= 0) {
            var n3 = ((c3 & 3) << 6) | c4;
            out += String.fromCharCode(n3);
        }
    }
    return out;
}

function resolveStreamrptPlayer(playerUrl, referer) {
    var r = null;
    try {
        r = pacedFetch(playerUrl, {
            referer: referer || BASE_URL + "/",
            minDelayMs: 0,
            maxDelayMs: 0,
            maxRetries: 0,
            timeout: 15000
        });
    } catch (e) {
        return null;
    }
    if (!r || !r.ok || !r.res) return null;
    var html = "";
    try { html = String(r.res.text() || ""); } catch (e2) { return null; }
    if (!html) return null;
    var m = html.match(/data-obf="([^"]+)"/i);
    if (!m || !m[1]) return null;
    var decoded = "";
    try {
        decoded = b64decodeToString(m[1]);
    } catch (e3) {
        return null;
    }
    var obj = null;
    try {
        obj = JSON.parse(decoded);
    } catch (e4) {
        return null;
    }
    if (!obj || !obj.pU) return null;
    return { stream: String(obj.pU), referer: referer || BASE_URL + "/" };
}

function resolveFbPlayer(playUrl, referer) {
    var r = null;
    try {
        r = pacedFetch(playUrl, {
            referer: referer || BASE_URL + "/",
            minDelayMs: 0,
            maxDelayMs: 0,
            maxRetries: 0,
            timeout: 15000
        });
    } catch (e) {
        return null;
    }
    if (!r || !r.ok || !r.res) return null;
    var html = "";
    try { html = String(r.res.text() || ""); } catch (e2) { return null; }
    if (!html) return null;
    var m = html.match(/var\s+cccc\s*=\s*"([^"]+\.mp4[^"]*)"/i);
    if (!m || !m[1]) return null;
    return { stream: m[1].replace(/&amp;/g, "&"), referer: playUrl };
}

function parseYanhh3dWatchServers(doc) {
    var out = [];
    if (!doc) return out;
    var btns = doc.select("a.btn3dsv[data-src]");
    var i = 0;
    for (i = 0; i < btns.size(); i++) {
        var a = btns.get(i);
        var src = String(a.attr("data-src") || "");
        if (!src) continue;
        var label = cleanText(a.text()) || ("Server " + (i + 1));
        var kind = (src.indexOf("play-fb-v8") !== -1) ? "fb" : "m3u8";
        out.push({ label: label, src: src, kind: kind });
    }
    return out;
}
