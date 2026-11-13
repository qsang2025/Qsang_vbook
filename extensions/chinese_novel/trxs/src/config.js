// config.js — cau hinh goc cua extension Trxs (trxs.cc, 同人小说网).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// MIRRORS: danh sach mirror theo thu tu uu tien, app inject tu config
// MIRRORS trong plugin.json duoi dang CHUOI cach nhau bang dau phay.
// Chu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM CHIEU trong
// try/catch, KHONG duoc khai bao var trung ten (se xung dot voi bien inject).
// Mirror www.trxs.cc do chinh site phuc vu cung noi dung (kiem chung live
// 2026-11-13: cung trang chi tiet, cung 24012B).
//
// LUU Y: file nay duoc tai len boi cac script khac, nen KHONG duoc tai them
// file nao khac o day. Script nao can helper thi tu tai file lib do o dau
// file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://trxs.cc";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
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
var MIRROR_LIST = ["https://www.trxs.cc"];

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
