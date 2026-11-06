// config.js — cau hinh goc cua extension Truyen Full (truyenfull.link).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. CONFIG_URL (neu co trong plugin.json) override
// sau cung. Ca hai phep override deu nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// MIRRORS: danh sach mirror theo thu tu uu tien, app inject tu config
// MIRRORS trong plugin.json duoi dang CHUOI cach nhau bang dau phay.
// Mirror mac dinh: truyenfull.live (domain chinh cua cung thuong hieu
// Truyen Full; tu VM nay tra 403 do Cloudflare chan IP datacenter nhung
// tren dien thoai co the qua duoc). fetchWithFallback() trong
// fetch-helpers.js dung MIRROR_LIST de thu lan luot cac mirror khi domain
// chinh chet.
// Chu y: DOMAIN / CONFIG_URL / MIRRORS la bien do app inject — chi duoc
// THAM CHIEU trong try/catch, KHONG duoc khai bao var trung ten
// (se xung dot voi bien inject). Ten noi bo dung o day la MIRROR_LIST.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://truyenfull.link";

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
var MIRROR_LIST = [
    "https://truyenfull.live"
];

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
