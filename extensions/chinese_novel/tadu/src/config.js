// config.js — cau hinh goc cua extension Tadu (tadu.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. MIRRORS (neu co trong
// plugin.json) override sau cung. Ca hai phep override deu nam trong
// try/catch: neu app khong inject bien do thi BASE_URL mac dinh van dung
// duoc. Luu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM
// CHIEU trong try/catch, KHONG duoc khai bao var trung ten.
//
// fetchPage(): fetch HTML co pacing — nghi jitter truoc moi request
// (ham rateLimitDelay o file rate-limit.js). Khong xoay User-Agent de
// cookie cf_clearance (neu co) con hieu luc. Site dung UTF-8 nen khong
// can giai ma GBK.
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.tadu.com";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

try {
    if (MIRRORS) {
        var injected = String(MIRRORS).split(",")[0].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
        if (injected) BASE_URL = injected;
    }
} catch (e2) {
}

function safeString(value) {
    return value == null ? "" : String(value).trim();
}

function cleanText(value) {
    return safeString(value).replace(/\s+/g, " ");
}

// Cat scheme + host + query/fragment, chi giu lai duong dan (bat dau "/").
// Dung de trich book id / chapter id tu URL day du.
function normalizeUrl(url) {
    url = safeString(url);
    if (!url) return "";
    url = url.replace(/^[a-z]+:\/\/[^\/]+/i, "");
    url = url.replace(/[?#].*$/, "");
    if (!url) return "";
    if (url.charAt(0) !== "/") url = "/" + url;
    if (url.length > 1) url = url.replace(/\/+$/, "");
    return url;
}

function buildAbsoluteUrl(path) {
    path = safeString(path);
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return BASE_URL + normalizeUrl(path);
}

// Anh bia cua site co dang https://media3.tadu.com//2021/... (2 dau /).
// Gom ve 1 dau / sau host de tranh loi 404 o mot so CDN.
function fixCover(url) {
    url = safeString(url);
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) {
        return url.replace(/^(https?:\/\/[^\/]+)\/+/, "$1/");
    }
    return buildAbsoluteUrl(url);
}

// m.tadu.com redirect ve www — doi ve www truoc khi fetch de tranh
// mat cookie / chuyen huong vo han.
function toWww(url) {
    url = safeString(url);
    return url.replace(/^https?:\/\/m\.tadu\.com/i, "https://www.tadu.com");
}

// Kênh (channel) cuoi URL store: the loai nam (98) dung 98; nu (122),
// xuat ban (79), nhi nguyen (270) dung chinh id cua no.
function channelFor(cat) {
    if (cat === "122" || cat === "79" || cat === "270") return cat;
    return "98";
}

// Site phan biet User-Agent: UA mobile bi redirect sang m.tadu.com
// (trang JS shell gan nhu rong), UA okhttp bi 403 — chi UA desktop moi
// nhan duoc trang SSR day du (kiem chung live 2026-11-12). Vi vay
// fetchPage LUON gui UA desktop Chrome co dinh cho moi request cua
// extension nay (ngoai le co bang chung theo quy tac nha 6.10).
var DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function fetchPage(url, options) {
    if (!options) options = {};
    try {
        if (typeof rateLimitDelay === "function") {
            rateLimitDelay(BASE_URL, 500, 1500);
        }
    } catch (e) {
    }
    var headers = {
        "User-Agent": DESKTOP_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Referer": BASE_URL + "/"
    };
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }
    options.headers = headers;
    return fetch(url, options);
}
