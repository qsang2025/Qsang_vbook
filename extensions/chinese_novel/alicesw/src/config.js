// config.js — cau hinh goc cua extension alicesw (alicesw.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. Luu y: DOMAIN la bien do
// app inject — chi duoc THAM CHIEU trong try/catch, KHONG duoc khai bao
// var trung ten.
//
// fetchPage(): fetch HTML co pacing — nghi jitter truoc moi request
// (ham rateLimitDelay o file rate-limit.js).
//
// Site phan biet User-Agent (kiem chung live 2026-11-12): UA desktop
// nhan duoc trang gan nhu rong — trang chi tiet khong co .detail-box,
// .jianjie hay .section-list (dem = 0); chi UA mobile moi nhan duoc
// template day du. Vi vay fetchPage LUON gui UA mobile iPhone co dinh
// cho moi request cua extension nay (ngoai le co bang chung theo quy
// tac nha 6.10; nguoc voi Tadu — noi chi UA desktop moi co SSR).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.alicesw.com";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Site chi tra noi dung cho UA mobile, UA desktop nhan template rong.
var MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

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

// Domain khong www se 301 ve www — doi ve www truoc khi fetch de tranh
// chuyen huong thua (fetch cua runtime van theo redirect, nhung doi
// truoc giu URL sach cho log va khoi mat cookie neu co).
function toWww(url) {
    url = safeString(url);
    return url.replace(/^https?:\/\/alicesw\.com/i, "https://www.alicesw.com");
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
        "User-Agent": MOBILE_UA,
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
