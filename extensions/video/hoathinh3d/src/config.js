// config.js — cau hinh goc cua extension Hoat Hinh 3D Trung Quoc.
//
// Nguon: API JSON cong khai https://phimapi.com (khong can scrape HTML).
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. CONFIG_URL (neu co trong plugin.json) override
// sau cung. Ca hai phep override deu nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// MIRRORS: API nay khong co mirror drop-in (KKPhim/OPhim la API khac,
// khac cau truc response) nen MIRROR_LIST mac dinh rong. Neu app inject
// MIRRORS thi van ton trong danh sach do.
// Luu y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://phimapi.com";

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

// Danh sach mirror mac dinh: rong (khong co mirror drop-in cho API nay).
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
