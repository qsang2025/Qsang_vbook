// config.js — cau hinh goc cua extension Bqgoo (bqgooo.cc).
//
// API JSON that o host rieng, khong phai trang web doc truyen:
//   BASE_URL mac dinh https://apibi.cc
//   Mirror: https://apiqu.cc, https://apige.cc (da kiem chung 200).
// Trang web doc truyen (link truyen / chuong) dung BOOK_ORIGIN
// https://www.bqgooo.cc; bia dung COVER_HOST https://www.bqg349.xyz.
// Nguoi dung doi API host trong cai dat (config DOMAIN trong
// plugin.json) thi gia tri do se override qua bien DOMAIN duoc app
// inject. CONFIG_URL (neu co trong plugin.json) override sau cung.
// Ca hai phep override deu nam trong try/catch: neu app khong inject
// bien do thi BASE_URL mac dinh van dung duoc.
//
// MIRRORS: danh sach mirror theo thu tu uu tien, app inject tu config
// MIRRORS trong plugin.json duoi dang CHUOI cach nhau bang dau phay.
// fetchJsonWithFallback() trong file helper.js dung MIRROR_LIST de thu
// lan luot cac mirror khi host chinh loi.
//
// LUU Y ve file duoc load: file nay duoc load boi cac script khac, nen
// KHONG duoc load them file nao khac o day. Script nao can helper thi tu
// load file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://apibi.cc";
var BOOK_ORIGIN = "https://www.bqgooo.cc";
var COVER_HOST = "https://www.bqg349.xyz";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (e) {
}

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
var MIRROR_LIST = ["https://apiqu.cc", "https://apige.cc"];

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
