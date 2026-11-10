// qimao-api.js — client API co ky cua 七猫免费小说 (qimao.com).
//
// KET QUA KHAO SAT (2026-11-09, da kiem chung live tu VM + tren may that):
// www.qimao.com chan IP datacenter (curl = empty reply) va gioi han toc do
// ca IP dien thoai (405 sau ~10 request nhanh) — nhung API tren
// api-bc.wtzw.com / api-ks.wtzw.com MO, khong bi chan, chay ca tu VM.
// Vi vay search/detail/toc dung API chinh thuc cua app (theo logic ky
// cong khai cua shing-yu/7mao-novel-downloader, duoc talebook#805 va
// swiftcat-downloader-flutter xac nhan lai), khong scrape HTML:
//   Search:  GET https://api-bc.wtzw.com/search/v1/words
//   Detail:  GET https://api-bc.wtzw.com/api/v1/reader/detail
//   Catalog: GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list
// Ky: MD5(concat cac "k=v" da sap xep key + SIGN_KEY), ca params lan
// headers (app-version co dinh "73720" — server chap nhan bat ky version
// nao trong danh sach, khong can random giong Python random.seed).
// MD5 tren may da kiem chung khop 100% Python hashlib (ca chu Han).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file crypto.js;
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file qimao-api.js;
// File duoc load KHONG duoc load them file khac. CryptoJS lay qua
// file crypto.js (built-in) — script goi phai load crypto.js TRUOC
// file nay.
//
// execute() duoi day chi de linter validate (moi file src/*.js phai co
// function execute) — file nay la thu vien load-only, khong bao gio chay
// doc lap nhu mot script (khong co trong script map cua plugin.json).
function execute() {
    return Response.error("qimao-api.js là thư viện dùng chung, không chạy độc lập");
}
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var QIMAO_SIGN_KEY = "d3dGiJc651gSQ8w1";
var QIMAO_APP_VERSION = "73720";
var QIMAO_API_BC = "https://api-bc.wtzw.com";
var QIMAO_API_KS = "https://api-ks.wtzw.com";

function qimaoMd5Hex(s) {
    return CryptoJS.MD5(s).toString();
}

// Ky mot dict params: them truong sign (MD5 cua "k=v" sap xep + key).
function qimaoSignParams(params) {
    var keys = Object.keys(params).sort();
    var str = "";
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        str += keys[i] + "=" + params[keys[i]];
    }
    params.sign = qimaoMd5Hex(str + QIMAO_SIGN_KEY);
    return params;
}

// Header app cua qimao (ky giong params).
function qimaoApiHeaders(bookId) {
    var h = {
        "AUTHORIZATION": "",
        "app-version": QIMAO_APP_VERSION,
        "application-id": "com.****.reader",
        "channel": "unknown",
        "net-env": "1",
        "platform": "android",
        "qm-params": "",
        "reg": "0"
    };
    var keys = Object.keys(h).sort();
    var str = "";
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        str += keys[i] + "=" + h[keys[i]];
    }
    h.sign = qimaoMd5Hex(str + QIMAO_SIGN_KEY);
    return h;
}

// GET JSON tu API qimao (co ky params + headers). Tra ve object da parse,
// hoac null khi loi mang/HTTP/JSON (caller bao loi tieng Viet).
function qimaoApiGet(baseUrl, path, params, bookId) {
    var p = qimaoSignParams(params);
    var url = baseUrl + path;
    var keys = Object.keys(p);
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        url += (url.indexOf("?") === -1 ? "?" : "&") +
            encodeURIComponent(keys[i]) + "=" + encodeURIComponent(p[keys[i]]);
    }
    var res = null;
    try {
        res = fetch(url, { headers: qimaoApiHeaders(bookId), timeout: 20000 });
    } catch (e) {
        console.log("qimaoApiGet fetch loi: " + url + " — " + e);
        return null;
    }
    if (!res || !res.ok) {
        console.log("qimaoApiGet HTTP " + (res ? res.status : 0) + ": " + url);
        return null;
    }
    var text = "";
    try {
        text = res.text();
    } catch (e2) {
        console.log("qimaoApiGet .text() loi: " + e2);
        return null;
    }
    if (!text) return null;
    if (isChallengeText(text)) {
        console.log("qimaoApiGet: trang challenge: " + url);
        return null;
    }
    try {
        return JSON.parse(text);
    } catch (e3) {
        console.log("qimaoApiGet JSON.parse loi: " + e3);
        return null;
    }
}
