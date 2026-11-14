// config.js — cau hinh goc cua extension Truyen Hay (truyenhay.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// Site la WordPress: moi bai viet la 1 truyen ngan hoac 1 ky cua truyen
// nhieu ky (vd "Tui phan 42"). Du lieu lay qua WP REST API
// (/wp-json/wp/v2/...), chi tiet + chuong doc HTML trang bai viet.
// Site khong co mirror biet duoc nen MIRROR_LIST mac dinh rong.
//
// LUU Y: file nay duoc tai len boi cac script khac, nen KHONG duoc tai them
// file nao khac o day. Script nao can pacing thi tu tai file rate-limit.js
// o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://truyenhay.com";

try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

var API_URL = BASE_URL + "/wp-json/wp/v2";

// Tach chuoi mirror cach nhau bang dau phay (hoac mang co san) thanh mang
// cac base URL sach (bo khoang trang va dau "/" cuoi).
function parseMirrorList(value) {
    var list = [];
    var parts = [];
    var i = 0;
    if (typeof value === "string") {
        parts = value.split(",");
        for (i = 0; i < parts.length; i++) {
            var u = parts[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (u) list.push(u);
        }
        return list;
    }
    if (value instanceof Array) {
        for (i = 0; i < value.length; i++) {
            var v = String(value[i]).replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (v) list.push(v);
        }
        return list;
    }
    return list;
}

// Danh sach mirror mac dinh (khop voi config MIRRORS trong plugin.json).
var MIRROR_LIST = [];

try {
    if (MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

// BASE_URL khong bao gio nam trong danh sach mirror (tranh thu lap chinh no).
(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// Chuan hoa URL ve host hien tai (doi domain/mirror van doc duoc link cu).
function normalizeUrl(url) {
    var u = String(url || "");
    if (!u) return u;
    if (u.indexOf("http") !== 0) {
        return BASE_URL + (u.charAt(0) === "/" ? "" : "/") + u;
    }
    return u.replace(/^(https?:\/\/)[^\/]+/, "$1" + BASE_URL.replace(/^https?:\/\//, ""));
}

// Site doi chu Latin thanh ky tu IPA/Cyrillic giong hinh trong noi dung
// bai viet (vd tran + ky tu g, nhan + ky tu s) — tra lai chu Latin that
// truoc khi hien thi (kiem chung live 2026-11-14 tren 2 bai mau).
var GLYPHS = { "ɡ": "g", "ɠ": "g", "ѕ": "s", "Ѕ": "S", "г": "r", "ɾ": "r", "һ": "h", "ɦ": "h", "ҡ": "k" };
function fixText(text) {
    return String(text || "").replace(/[ɡɠѕЅгɾһɦҡ]/g, function (ch) {
        return GLYPHS[ch] || ch;
    });
}

// Giai ma HTML entity trong tieu de/mo ta lay tu JSON API.
function decodeHtml(text) {
    return Html.parse(String(text || "")).text();
}

function cleanTitle(text) {
    return fixText(decodeHtml(text)).replace(/\s+/g, " ").trim();
}

// Moi bai viet WordPress la 1 ky. Truyen nhieu ky co tieu de dang
// "Ten truyen: Chuong 12", "Ten truyen chuong 12", "Ten truyen phan 12"
// hoac "Ten truyen 12" — tach ten truyen (series) va so ky.
function parseTitle(title) {
    title = cleanTitle(title);
    var match = /^(.+?)[\s:,\.\-–]*(?:(?:chương|phần|tập|kỳ|chap)\s*)?(\d+)$/i.exec(title);
    if (match && match[1].trim().length > 1) {
        return { series: match[1].trim(), number: parseInt(match[2], 10), title: title };
    }
    return { series: title, number: 0, title: title };
}

function seriesKey(text) {
    return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function chapterName(info) {
    if (!info.number) return info.title;
    var rest = info.title.substring(info.series.length).replace(/^[\s:,\.\-–]+/, "");
    return /^\d+$/.test(rest) ? "Chương " + rest : rest;
}

// Lay slug bai viet tu URL dang /<slug>.html.
function postSlug(url) {
    var match = /\/([^\/?#]+)\.html/.exec(String(url || ""));
    return match ? match[1] : "";
}

// Anh bia cua bai viet (wp:featuredmedia). API chi tra _embedded khi KHONG
// dung _fields (kiem chung live: _fields + _embed lam mat _embedded), nen
// danh sach lay anh bia bang 1 cuoc goi gom /media?include=<ids> rieng
// (xem fetchCovers). Bai nao khong co anh thi cover "".
function postCover(post) {
    var media = post._embedded && post._embedded["wp:featuredmedia"];
    return media && media[0] && media[0].source_url ? media[0].source_url : "";
}

// Danh sach hien 1 muc cho moi truyen: cac ky cua cung truyen trong 1
// trang duoc gop lai, lay link cua ky moi nhat (API tra theo ngay giam dan).
function groupPosts(posts) {
    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < (posts || []).length; i++) {
        var post = posts[i];
        var info = parseTitle(post.title.rendered);
        var key = seriesKey(info.series);
        if (!info.series || seen[key]) continue;
        seen[key] = true;
        items.push({
            name: info.series,
            link: post.link,
            cover: postCover(post),
            description: info.number ? "Mới: " + chapterName(info) : cleanTitle(post.excerpt.rendered).substring(0, 160),
            tag: info.number ? "Nhiều kỳ" : "",
            _mediaId: post.featured_media || 0
        });
    }
    return items;
}

// Lay anh bia hang loat cho cac muc vua gop: 1 cuoc goi /media duy nhat.
// Loi thi bo qua (cover ""), khong lam hong danh sach.
function fetchCovers(items) {
    var ids = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < items.length; i++) {
        var id = items[i]._mediaId;
        if (id && !seen[id]) {
            seen[id] = true;
            ids.push(String(id));
        }
    }
    if (ids.length === 0) {
        for (i = 0; i < items.length; i++) delete items[i]._mediaId;
        return;
    }
    rateLimitDelay("truyenhay.com");
    var res = fetch(API_URL + "/media", {
        queries: { include: ids.join(","), per_page: "100", _fields: "id,source_url" }
    });
    var byId = {};
    if (res.ok) {
        var media = res.json() || [];
        for (i = 0; i < media.length; i++) {
            byId[media[i].id] = media[i].source_url || "";
        }
    }
    for (i = 0; i < items.length; i++) {
        if (items[i]._mediaId && byId[items[i]._mediaId]) {
            items[i].cover = byId[items[i]._mediaId];
        }
        delete items[i]._mediaId;
    }
}

// Goi API /posts co pacing (1 request/lan/host). Tra ve doi tuong response
// (caller tu kiem tra .ok roi moi .json()).
function fetchPosts(queries) {
    rateLimitDelay("truyenhay.com");
    return fetch(API_URL + "/posts", { queries: queries });
}

// Token trang sau tu header x-wp-totalpages cua API.
function nextToken(response, page) {
    var current = parseInt(page, 10) || 1;
    var total = parseInt(response.header("x-wp-totalpages"), 10) || 0;
    return current < total ? String(current + 1) : "";
}
