// config.js — cau hinh goc cua extension 七猫免费小说 (qimao.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Ca hai phep override deu nam trong try/catch:
// neu app khong inject bien do thi BASE_URL mac dinh van dung duoc.
//
// MIRRORS: danh sach mirror theo thu tu uu tien, app inject tu config
// MIRRORS trong plugin.json duoi dang CHUOI cach nhau bang dau phay.
// CHUA CO mirror nao duoc kiem chung cho qimao.com (2026-11-09): wtzw.com
// (梧桐中文网, tien than cua qimao — CDN bia van dung cdn.wtzw.com)
// la ung vien nhung CHUA xac minh duoc www.wtzw.com co phuc vu cung
// duong dan hay khong, nen MIRROR_LIST mac dinh de RONG — nguoi dung tu
// them khi co mirror xac thuc. fetchWithFallback() trong fetch-helpers.js
// dung MIRROR_LIST de thu lan luot cac mirror khi domain chinh chet.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.qimao.com";

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

// Danh sach mirror mac dinh: RONG (chua co mirror kiem chung — xem tren).
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
