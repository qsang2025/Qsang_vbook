// config.js — cau hinh goc cua extension Web Truyen Dich.
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// LUU Y:
// - Khong set User-Agent co dinh o day (quy tac 10 AGENTS.md): fetch dung UA
//   mac dinh cua runtime de cookie cf_clearance cua Cloudflare con hieu luc.
//   Trang chuong cua site co Cloudflare challenge — neu may bi chan, mo
//   truyen trong trinh duyet cua app mot lan de qua xac minh roi doc lai.
// - File nay duoc tai len boi cac script khac, nen KHONG duoc tai them file
//   nao khac o day. Script nao can pacing thi tu tai file rate-limit.js
//   o dau file cua chinh no.
// - Ham safeFirst(): quirk runtime vBook — Elements.first() KHONG BAO GIO
//   tra null (select rong van tra object truthy) nen moi cho fallback
//   if (!el) deu khong chay. Luon kiem tra size() > 0 truoc khi first().
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://webtruyendich.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

var BASE_ORIGIN = String(BASE_URL || "").replace(/\/+$/, "");

// Tra ve phan tu dau tien cua select, hoac null neu select rong.
// Dung thay cho .first() tran (xem ghi chu safeFirst o dau file).
function safeFirst(elements) {
    try {
        if (elements && typeof elements.size === "function" && elements.size() > 0) {
            return elements.first();
        }
    } catch (e) {
    }
    return null;
}

function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (!url) return "";
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_ORIGIN);
    }
    if (url.charAt(0) === "/") return BASE_ORIGIN + url;
    return BASE_ORIGIN + "/" + url;
}

function toAbs(url) {
    if (!url) return "";
    url = String(url).trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_ORIGIN + (url.indexOf("/") === 0 ? "" : "/") + url;
}

function normalizeCoverUrl(cover) {
    if (!cover) return "";
    cover = normalizeUrl(cover);
    try {
        var urlObj = new URL(cover);
        urlObj.pathname = urlObj.pathname
            .split("/")
            .map(function (p) {
                try {
                    return encodeURIComponent(decodeURIComponent(p));
                } catch (err) {
                    return encodeURIComponent(p);
                }
            })
            .join("/");
        return urlObj.toString() + "";
    } catch (e) {
        return encodeURI(cover) + "";
    }
}

function cleanText(text) {
    if (!text) return "";
    return String(text).replace(/\s+/g, " ").trim();
}

// Fetch HTML co pacing: nghi jitter truoc moi request (rateLimitDelay o file
// rate-limit.js — script goi ham nay phai tai ca 2 file). Khong set UA.
function fetchPage(url, options) {
    if (!options) options = {};
    try {
        if (typeof rateLimitDelay === "function") {
            rateLimitDelay(BASE_ORIGIN, 500, 1500);
        }
    } catch (e) {
    }
    var headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8",
        "Referer": BASE_ORIGIN + "/"
    };
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }
    options.headers = headers;
    return fetch(url, options);
}

function toBook(item) {
    if (!item) return null;
    var title = String(item.title || item.name || item.novel_title || "").trim();
    if (title) title = title.replace(/^Bìa truyện\s+/i, "").trim();

    var slug = String(item.url || item.slug || item.novel_slug || "").trim();
    var link = slug.indexOf("http") === 0 ? slug : (BASE_ORIGIN + "/truyen/" + slug);
    var cover = toAbs(item.thumbnail || item.cover || item.image || "");

    var meta = [];
    if (item.author || item.novel_author) meta.push(item.author || item.novel_author);
    if (item.genre_name) meta.push(item.genre_name);
    if (item.status || item.novel_status) meta.push(item.status || item.novel_status);
    if (item.max_chapters) meta.push(item.max_chapters + " chương");

    return {
        name: title,
        link: toAbs(link),
        cover: cover,
        description: meta.join(" · "),
        host: BASE_ORIGIN
    };
}

if (typeof Response === "undefined") {
    var Response = {
        success: function (data, data2) {
            return JSON.stringify({ code: 0, data: data, data2: data2 });
        },
        error: function (data) {
            return JSON.stringify({ code: 1, data: data });
        }
    };
}
