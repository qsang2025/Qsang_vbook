// config.js — cau hinh goc cua extension 無限小說 (8book.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. MIRRORS (neu co trong
// plugin.json) override sau cung. Ca hai phep override deu nam trong
// try/catch: neu app khong inject bien do thi BASE_URL mac dinh van dung
// duoc. Luu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM
// CHIEU trong try/catch, KHONG duoc khai bao var trung ten.
// Ten noi bo dung o day la MIRROR_LIST. Site khong co mirror nao biet
// duoc nen danh sach mac dinh rong.
//
// DAC BIET (kiem chung live 2026-11-16, probe tren may that):
// - Trang chuong tinh RONG (#text/#subtitle/#content deu rong) — noi dung
//   nap qua JS + iframe share.html; chap.js PHAI dung WebView (Engine),
//   khong fetch tinh duoc.
// - Link chuong trong muc luc tro ve host //sport.thepaperbooks.com (domain
//   spam/SEO, 0 ky tu) nhung episode id la that — normalize8bUrl viet lai
//   host ve www.8book.com, GIU NGUYEN query ?<episode> (khong duoc cat
//   query nhu cac site khac).
// - Fetch dung UA mac dinh cua runtime (khong xoay UA — quy tac nha 6.10).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.8book.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
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
var MIRROR_LIST = [];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
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

// Host spam ma link muc luc tro ve (kiem chung live 2026-11-16): cac link
// //sport.thepaperbooks.com/read/<id>/?<ep> dan ve trang SEO rac, 0 ky tu.
// Episode id trong query la that — chi viet lai host ve 8book.com.
var SPAM_HOST = "sport.thepaperbooks.com";

// Chuan hoa URL ve 8book.com:
// - //sport.thepaperbooks.com/... -> https://www.8book.com/...
// - //www.8book.com/... -> https://www.8book.com/...
// - 8book.com/... (khong scheme) -> https://www.8book.com/...
// - GIU NGUYEN query (?<episode> cua trang chuong) va fragment.
// - Neu URL da dung host 8book.com thi tra nguyen.
function normalize8bUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    s = s.replace(/^https?:\/\/sport\.thepaperbooks\.com/i, "https://www.8book.com");
    s = s.replace(/^https?:\/\/8book\.com/i, "https://www.8book.com");
    return s;
}

// Fetch 1 trang HTML (UTF-8) co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetch8bDoc(url) {
    var r = pacedFetch(url, {});
    if (!r.ok) {
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("8book", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        return { error: "Không tải được trang (HTTP " + (r.status || "?") + ")." };
    }
    var doc = null;
    try {
        doc = docFromResponse(r.res, url);
    } catch (e) {
        return { error: "Không đọc được trang." };
    }
    if (!doc) return { error: "Không đọc được trang." };
    return { doc: doc };
}
