// config.js — cau hinh goc cua extension Ijjxs (ijjxsxzw.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch: neu app
// khong inject bien do thi BASE_URL mac dinh van dung duoc.
//
// SCHEME: chi https:// tra 200 truc tiep tu VM (kiem chung 2026-11-16):
// http://www.ijjxsxzw.com, http://m.ijjxsxzw.com, http://www.ijjxs.com
// va https://www.ijjxs.com deu 301 ve https://www.ijjxsxzw.com/ —
// runtime fetch khong theo redirect 301 (tien le powanjuan) nen cac
// dang http KHONG dung duoc lam base fetch. Chi co 2 host https song:
// www.ijjxsxzw.com (chinh) va m.ijjxsxzw.com (mirror).
// MIRRORS: chi https://m.ijjxsxzw.com (200, cung noi dung).
//
// ENCODING: site dung UTF-8 (Content-Type: text/html; charset=UTF-8),
// KHONG phai GBK nhu cac site EmpireCMS khac — helper fetchIjDoc dung
// res.html() mac dinh, khong can giai ma GBK.
//
// LUU Y: file nay duoc tai len boi cac script khac, nen KHONG duoc
// tai them file nao khac o day. Script nao can helper thi tu tai
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.ijjxsxzw.com";

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

// Mirror du phong: https://m.ijjxsxzw.com (kiem chung 200, cung noi dung).
var MIRROR_LIST = ["https://m.ijjxsxzw.com"];

try {
    if (MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        for (var j = 0; j < injected.length; j++) {
            if (MIRROR_LIST.indexOf(injected[j]) === -1) MIRROR_LIST.push(injected[j]);
        }
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
