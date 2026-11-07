// config.js — cau hinh goc cua extension NiACG (niacg.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. CONFIG_URL (neu co trong plugin.json) override
// sau cung. Ca hai phep override deu nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// MIRRORS: danh sach mirror theo thu tu uu tien, app inject tu config
// MIRRORS trong plugin.json duoi dang CHUOI cach nhau bang dau phay.
// Mirror mac dinh: xpicvid.com (cung site, cung noi dung — kiem chung
// 2026-11-07: trang chu tra ve cung tieu de va dung luong).
// fetchWithFallback() trong fetch-helpers.js dung MIRROR_LIST de thu lan
// luot cac mirror khi domain chinh chet.
// Chu y: DOMAIN / CONFIG_URL / MIRRORS la bien do app inject — chi duoc
// THAM CHIEU trong try/catch, KHONG duoc khai bao var trung ten
// (se xung dot voi bien inject). Ten noi bo dung o day la MIRROR_LIST.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.niacg.com";

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
    "https://www.xpicvid.com"
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

// ---------------------------------------------------------------------------
// Cac muc (classid) cua site — EmpireCMS. Chi cac muc ANH (gallery/manga)
// moi thuoc pham vi extension comic nay; cac muc VIDEO (19 里番, 20 3D,
// 21 同人, 23 视频列表) co cau truc khac (DPlayer mp4) va can mot extension
// video rieng (xem README).
//   1 COS · 2 CG · 3 本子 · 4 套图 · 9 最新 · 12 漫画 (tong hop 14+15)
//   14 日漫 · 15 韩漫 · 22 画廊
// ---------------------------------------------------------------------------
var IMAGE_CLASSES = [1, 2, 3, 4, 9, 12, 14, 15, 22];

var CLASS_NAMES = {
    1: "COS",
    2: "CG",
    3: "本子",
    4: "套图",
    9: "最新",
    12: "漫画",
    14: "日漫",
    15: "韩漫",
    22: "画廊"
};

// Manga series: chi class 14 (日漫) va 15 (韩漫) moi co dang series
// (trang showinfo = danh sach chuong). Cac muc khac: 1 item = 1 bo anh.
function isSeriesClass(classid) {
    return classid === 14 || classid === 15;
}

function className(classid) {
    var n = CLASS_NAMES[classid];
    return n ? n : ("Mục " + classid);
}
