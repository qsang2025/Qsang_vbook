// helper.js — ham dung chung cua extension YanHH3D (yanhh3d.baby).
// Site front tuy chinh (khong phai HaLim tren .baby):
//   danh sach: .flw-item > .film-poster img.film-poster-img[data-src],
//              a.film-poster-ahref[href], .film-name a.dynamic-name,
//              .tick-rate (vd. "100/104 [4K]"), .tick-dub ("4K TM-VS")
//   phan trang danh sach: ul.pagination a[href*='page='] (?page=N)
//   chi tiet:  h1.film-name, img.film-poster-img, meta og:description,
//              JSON-LD TVSeries (genre[]), a.btn-play (tap moi nhat TM),
//              a.btn-play.custom-button-sub (tap moi nhat VS)
//   trang xem: #top-comment a.ssl-item (tap TM, title=N),
//              #new-comment a.ssl-item (tap VS, href /sever2/...),
//              server: a.btn3dsv[data-src] (nhan 1080/1080-/HD/4K/4K-)
//   stream:    data-src .m3u8 thuc ra la trang JWPlayer HTML chua
//              data-obf (base64 JSON {sU: playlist AES-GCM — BO,
//              pU: playlist HLS thuong — DUNG}); link play-fb-v8 la
//              trang JWPlayer chua var cccc = "<fbcdn mp4>" (full tap).
// File nay duoc nap boi cac script khac, KHONG nap them file nao o day.
// Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js
// truoc file helper.js.
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

function parseFilmCard(item) {
    if (!item) return null;
    var nameLink = safeFirst(item.select(".film-name a"));
    if (nameLink === null) nameLink = safeFirst(item.select("a.film-poster-ahref"));
    if (nameLink === null) return null;
    var name = cleanText(nameLink.attr("title")) || cleanText(nameLink.text());
    if (!name) {
        var img0 = safeFirst(item.select("img.film-poster-img"));
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;
    var href = String(nameLink.attr("href") || "");
    if (!href) {
        var ahref = safeFirst(item.select("a.film-poster-ahref"));
        if (ahref !== null) href = String(ahref.attr("href") || "");
    }
    if (!href) return null;
    var link = absUrl(href).replace(/\/+$/, "");
    var path = link.replace(/^https?:\/\/[^\/]+/i, "");
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return null;
    if (/^\/(moi-cap-nhat|dang-chieu|hoan-thanh|hoat-hinh-ai|hoat-hinh-2d|hoat-hinh-3d|hoat-hinh-4k|phim-le|the-loai|login|user|css|js|storage|vendor|search|ajax)/.test(path)) {
        return null;
    }
    var cover = "";
    var img = safeFirst(item.select("img.film-poster-img"));
    if (img === null) img = safeFirst(item.select("img"));
    if (img !== null) {
        cover = unwrapCover(img.attr("data-src") || img.attr("data-original") || img.attr("src"));
    }
    var tagParts = [];
    var rate = safeFirst(item.select(".tick-rate"));
    if (rate !== null) {
        var rt = cleanText(rate.text());
        if (rt) tagParts.push(rt);
    }
    var dub = safeFirst(item.select(".tick-dub"));
    if (dub !== null) {
        var dt = cleanText(dub.text());
        if (dt) tagParts.push(dt);
    }
    return {
        name: name,
        cover: cover,
        link: link,
        description: "",
        tag: tagParts.join(" · "),
        host: ""
    };
}

function pageUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return url;
    var raw = String(url || "");
    var q = raw.indexOf("?");
    var pathPart = q !== -1 ? raw.substring(0, q) : raw;
    var queryPart = q !== -1 ? raw.substring(q + 1) : "";
    var params = [];
    if (queryPart) {
        var bits = queryPart.split("&");
        var i = 0;
        for (i = 0; i < bits.length; i++) {
            if (bits[i].indexOf("page=") !== 0) params.push(bits[i]);
        }
    }
    params.push("page=" + n);
    return pathPart + "?" + params.join("&");
}

function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;
    var cards = doc.select(".flw-item");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseFilmCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    var maxPage = cur;
    var links = doc.select("ul.pagination a[href*='page=']");
    for (i = 0; i < links.size(); i++) {
        var m = String(links.get(i).attr("href") || "").match(/[?&]page=(\d+)/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    }
    return { items: items, next: maxPage > cur ? String(cur + 1) : "" };
}

function episodeNumber(s) {
    var m = String(s || "").match(/tap-(\d+)/i);
    if (!m) m = String(s || "").match(/Tập\s*(\d+)/i);
    if (!m) m = String(s || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function episodeSortKey(epAttr, text) {
    var s = String(epAttr || "");
    var mDec = s.match(/tap-(\d+)-(\d+)/i);
    if (mDec) return parseFloat(mDec[1] + "." + mDec[2]);
    var m = s.match(/tap-(\d+)/i);
    if (!m) m = String(text || "").match(/Tập\s*(\d+(?:\.\d+)?)/i);
    if (!m) m = s.match(/(\d+)/);
    if (!m) m = String(text || "").match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
}

function stripVnDiacritics(s) {
    var str = String(s || "").toLowerCase();
    var map = [
        ["à", "a"], ["á", "a"], ["ả", "a"], ["ã", "a"], ["ạ", "a"],
        ["ă", "a"], ["ằ", "a"], ["ắ", "a"], ["ẳ", "a"], ["ẵ", "a"], ["ặ", "a"],
        ["â", "a"], ["ầ", "a"], ["ấ", "a"], ["ẩ", "a"], ["ẫ", "a"], ["ậ", "a"],
        ["è", "e"], ["é", "e"], ["ẻ", "e"], ["ẽ", "e"], ["ẹ", "e"],
        ["ê", "e"], ["ề", "e"], ["ế", "e"], ["ể", "e"], ["ễ", "e"], ["ệ", "e"],
        ["ì", "i"], ["í", "i"], ["ỉ", "i"], ["ĩ", "i"], ["ị", "i"],
        ["ò", "o"], ["ó", "o"], ["ỏ", "o"], ["õ", "o"], ["ọ", "o"],
        ["ô", "o"], ["ồ", "o"], ["ố", "o"], ["ổ", "o"], ["ỗ", "o"], ["ộ", "o"],
        ["ơ", "o"], ["ờ", "o"], ["ớ", "o"], ["ở", "o"], ["ỡ", "o"], ["ợ", "o"],
        ["ù", "u"], ["ú", "u"], ["ủ", "u"], ["ũ", "u"], ["ụ", "u"],
        ["ư", "u"], ["ừ", "u"], ["ứ", "u"], ["ử", "u"], ["ữ", "u"], ["ự", "u"],
        ["ỳ", "y"], ["ý", "y"], ["ỷ", "y"], ["ỹ", "y"], ["ỵ", "y"],
        ["đ", "d"]
    ];
    var i = 0;
    var j = 0;
    for (i = 0; i < map.length; i++) {
        var from = map[i][0];
        var to = map[i][1];
        var out = "";
        for (j = 0; j < str.length; j++) {
            out += (str.charAt(j) === from) ? to : str.charAt(j);
        }
        str = out;
    }
    return str;
}

function slugifyVn(s) {
    var str = stripVnDiacritics(s);
    var out = "";
    var i = 0;
    for (i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if ((c >= "a" && c <= "z") || (c >= "0" && c <= "9")) out += c;
        else if (c === " " || c === "-" || c === "_") out += "-";
    }
    out = out.replace(/-+/g, "-").replace(/^-/, "").replace(/-$/, "");
    return out;
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

// Giai trang player cua streamrpt1 (data-src .m3u8): lay data-obf,
// base64-decode thanh JSON, tra ve link pU (playlist HLS thuong).
// sU la playlist AES-GCM da niem phong — bo qua, khong giai.
// Tra ve {stream, referer} hoac null khi khong giai duoc.
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

// Giai trang play-fb-v8: lay var cccc = "<fbcdn mp4>" (full tap).
// Tra ve {stream, referer} hoac null khi khong giai duoc.
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

function toSever2Url(watchUrl) {
    var u = String(watchUrl || "");
    if (u.indexOf("/sever2/") !== -1) return u;
    var m = u.match(/^(https?:\/\/[^\/]+)\/(.+)$/i);
    if (!m) return u;
    return m[1] + "/sever2/" + m[2];
}

function watchSlugAndEp(watchUrl) {
    var u = String(watchUrl || "");
    var m = u.match(/\/sever2\/([^\/]+)\/tap-(\d+)/i);
    if (m) return { slug: m[1], ep: parseInt(m[2], 10), sever2: true };
    m = u.match(/\/([^\/]+)\/tap-(\d+)/i);
    if (m) return { slug: m[1], ep: parseInt(m[2], 10), sever2: false };
    return { slug: "", ep: 0, sever2: false };
}

// Danh sach server tren mot trang xem: a.btn3dsv[data-src].
// Tra ve [{label, src, kind}] theo thu tu tren trang.
function parseWatchServers(doc) {
    var out = [];
    var btns = doc.select("a.btn3dsv[data-src]");
    var i = 0;
    for (i = 0; i < btns.size(); i++) {
        var a = btns.get(i);
        var src = String(a.attr("data-src") || "");
        if (!src) continue;
        var label = cleanText(a.text());
        if (!label) label = "Server " + (i + 1);
        var kind = (src.indexOf("play-fb-v8") !== -1) ? "fb" : "m3u8";
        out.push({ label: label, src: src, kind: kind });
    }
    return out;
}

// Danh sach tap TM tren mot trang xem: #top-comment a.ssl-item.
function parseWatchEpisodes(doc) {
    var out = [];
    var seen = {};
    var links = doc.select("#top-comment a.ssl-item");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var fullUrl = absUrl(href);
        if (seen[fullUrl]) continue;
        seen[fullUrl] = true;
        var num = episodeNumber(a.attr("title")) || episodeNumber(a.text());
        out.push({ num: num, url: fullUrl });
    }
    out.sort(function (x, y) { return x.num - y.num; });
    return out;
}
