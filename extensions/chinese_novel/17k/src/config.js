// config.js — cau hinh goc cua extension 17k (www.17k.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. Luu y: DOMAIN la bien do
// app inject — chi duoc THAM CHIEU trong try/catch, KHONG duoc khai bao
// var trung ten.
//
// APP_KEY: key public cua site (Q.appkey.dev trong file JS public
// static.17k.com/www/Q/Q.js) — dung cho API bang xep hang. API tim kiem
// cu (api.ali.17k.com/v2/book/search) da chet: tra 61000 "请升级版本" voi
// ca 2 appKey (dev + cdn), moi _versions, ca http/https (kiem chung
// 2026-11-12); form web search.17k.com bi WAF Alibaba chan ca tren VM
// lan may that (test tren may that 2026-11-12 tra code 1) — nen KHONG
// co search.js (mau aztruyen), detail cung khong dua tag vao genres.
//
// fetchPage(): fetch HTML co pacing — nghi jitter truoc moi request
// (ham rateLimitDelay o file rate-limit.js). Site tra SSR day du voi UA
// mac dinh cua runtime (kiem chung live 2026-11-12 tu VM) — KHONG xoay UA.
//
// resolveUrl(): giai quyet moi dang link tren trang (tuyet doi, bat dau
// bang /, //protocol-relative, tuong doi) thanh URL tuyet doi. Site dung
// nhieu link //www.17k.com/... — phai xu ly rieng, khong dung BASE_URL +
// normalizeUrl tho (se thanh https://www.17k.com//www.17k.com/...).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.17k.com";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var APP_KEY = 2406394919;

function safeString(value) {
    return value == null ? "" : String(value).trim();
}

function cleanText(value) {
    return safeString(value).replace(/\s+/g, " ");
}

function resolveUrl(href) {
    href = safeString(href);
    if (!href) return "";
    if (/^https?:\/\//i.test(href)) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

// Cat scheme + host + query/fragment, chi giu lai duong dan (bat dau "/").
// Dung de trich book id tu URL day du.
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

function fetchPage(url, options) {
    if (!options) options = {};
    try {
        if (typeof rateLimitDelay === "function") {
            rateLimitDelay(BASE_URL, 500, 1500);
        }
    } catch (e) {
    }
    var headers = {
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
