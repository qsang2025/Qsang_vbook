// config.js — Cau hinh domain va caching cho SangtacvietApp
//
// BASE_URL mac dinh la domain chinh (.app). Cac domain .vip / .com / .pro
// la mirror that cua cung mot site.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://sangtacviet.app";
var PAGE_SIZE = 48;

var STV_GRANT_FLAG_WINDOW = "UWNgB";
var STV_GRANT_FLAG_APP = "tcYCI";
var STV_SIGN_SALT = "erogh982^%*%^*";
var STV_WEBVIEW_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

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

var MIRROR_LIST = ["https://sangtacviet.vip", "https://sangtacviet.com", "https://sangtacviet.pro"];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// Ghi lai lan bi chan theo IP gan nhat de bao dung loi tieng Viet
// ("tam chan, thu lai sau X phut") thay vi loi HTTP chung chung.
// Chi co y nghia khi host do dang trong cooldown live (xem stvBlockedMessage).
var STV_LAST_BLOCKED = null;

// Tra thong bao "tam chan" neu host vua bi chan 405/429 va van trong thoi
// gian cooldown; nguoc lai tra null. Chi goi o nhanh loi (res null hoac
// !res.ok), khong goi khi da success.
function stvBlockedMessage() {
    try {
        if (STV_LAST_BLOCKED && STV_LAST_BLOCKED.host
            && typeof cooldownRemainingMs === "function"
            && typeof rateLimitErrorMessage === "function") {
            var remain = cooldownRemainingMs(STV_LAST_BLOCKED.host);
            if (remain > 0) {
                return rateLimitErrorMessage("Sáng Tác Việt", STV_LAST_BLOCKED.host, remain);
            }
        }
    } catch (e) {
    }
    return null;
}

// Fetch co failover qua mirror + pacing chong rate-limit (I3/I4):
// - Moi request deu qua pacedFetch() (lib/rate-limit.js, can script goi
//   phai load('rate-limit.js')): kiem tra cooldown truoc, nghi jitter
//   0,5-1,5s, fetch 1 lan duy nhat (maxRetries: 0).
// - (I3) Da nhan HTTP response (ke ca 4xx/5xx) thi tra ngay, KHONG thu
//   mirror tiep — mirror nao cung tra loi nhu nhau, thu them chi nhan
//   thoi gian cho (tung mat 138s vi 504). Chi failover khi fetch nem
//   exception hoac khong co response (loi mang).
// - (I4) Gap 405/429 thi pacedFetch tu ghi cooldown (60 phut mac dinh);
//   lan goi sau trong cooldown se fail nhanh, khong gui request.
// - Chi failover khi URL thuoc mot origin STV da biet (BASE_URL hoac mirror).
// - Khi mot mirror tra ok, gan BASE_URL = mirror do de cac buoc sau trong
//   cung lan execute() (detail -> toc -> chap) o cung origin.
function fetchWithMirrors(url, options) {
    var originMatch = String(url).match(/^https?:\/\/[^\/]+/);
    var origin = originMatch ? originMatch[0] : "";
    var known = (origin === BASE_URL);
    var m = 0;
    if (!known) {
        for (m = 0; m < MIRROR_LIST.length; m++) {
            if (origin === MIRROR_LIST[m]) { known = true; break; }
        }
    }
    var bases = [BASE_URL];
    if (known) {
        for (m = 0; m < MIRROR_LIST.length; m++) {
            bases.push(MIRROR_LIST[m]);
        }
    }
    for (var i = 0; i < bases.length; i++) {
        var tryUrl = url;
        if (i > 0) {
            tryUrl = String(url).replace(/^https?:\/\/[^\/]+/, bases[i]);
        }
        var host = "";
        try {
            var hm = String(tryUrl).match(/^https?:\/\/([^\/:?#]+)/i);
            if (hm) host = hm[1].toLowerCase();
        } catch (eHost) {
        }
        // Duong chinh: pacedFetch (can co load('rate-limit.js') o script goi).
        if (typeof pacedFetch === "function") {
            var r = null;
            try {
                r = pacedFetch(tryUrl, {
                    method: (options && options.method) || "GET",
                    headers: (options && options.headers) || null,
                    body: (options && options.body) || null,
                    maxRetries: 0
                });
            } catch (ePaced) {
                r = null;
            }
            if (r && r.error === "cooldown") {
                STV_LAST_BLOCKED = { host: host, remainingMs: r.cooldownRemainingMs || 0 };
                return null;
            }
            if (r && r.res) {
                if (r.status === 429 || r.status === 405) {
                    STV_LAST_BLOCKED = { host: host, remainingMs: 0 };
                    try {
                        if (typeof cooldownRemainingMs === "function") {
                            STV_LAST_BLOCKED.remainingMs = cooldownRemainingMs(host);
                        }
                    } catch (eCd) {
                    }
                }
                if (r.ok && i > 0) {
                    BASE_URL = bases[i];
                }
                return r.res;
            }
            // Khong co response (loi mang) -> thu mirror tiep.
            continue;
        }
        // Fallback khi rate-limit.js chua duoc load: fetch thuong + pacing
        // neu co, giu nguyen ngu nghia I3 (co response thi tra ngay).
        if (typeof rateLimitDelay === "function") {
            try { rateLimitDelay(host); } catch (eDL) {}
        }
        var res = null;
        try {
            res = fetch(tryUrl, options || {});
        } catch (e) {
            res = null;
        }
        if (res) {
            if (res.status === 429 || res.status === 405) {
                STV_LAST_BLOCKED = { host: host, remainingMs: 0 };
                try {
                    if (typeof setCooldown === "function") setCooldown(host, 60 * 60 * 1000);
                    if (typeof cooldownRemainingMs === "function") {
                        STV_LAST_BLOCKED.remainingMs = cooldownRemainingMs(host);
                    }
                } catch (eCd2) {
                }
            }
            if (res.ok && i > 0) {
                BASE_URL = bases[i];
            }
            return res;
        }
    }
    return null;
}

// Memory fallback cache neu cacheStorage hoac localStorage khong san sang
var STV_KEY_CACHE = {};

// Lay khoa doc chuong da duoc cache cho truyen (host + bookid)
// Giup chuyen chuong tuc thi ma khong can giai ma lai key qua WebView!
function getStoredKey(host, bookid) {
    var cacheKey = "stv_app_key_" + host + "_" + bookid;
    try {
        if (typeof cacheStorage !== "undefined" && cacheStorage && typeof cacheStorage.getItem === "function") {
            var val = cacheStorage.getItem(cacheKey);
            if (val) {
                var parsed = JSON.parse(val);
                if (parsed && parsed.key) return parsed;
            }
        }
    } catch (e1) {}

    try {
        if (typeof localStorage !== "undefined" && localStorage && typeof localStorage.getItem === "function") {
            var val2 = localStorage.getItem(cacheKey);
            if (val2) {
                var parsed2 = JSON.parse(val2);
                if (parsed2 && parsed2.key) return parsed2;
            }
        }
    } catch (e2) {}

    if (STV_KEY_CACHE[cacheKey]) {
        return STV_KEY_CACHE[cacheKey];
    }

    return null;
}

// Luu khoa doc chuong vao cache
function setStoredKey(host, bookid, key, readcontextid) {
    if (!key) return;
    var cacheKey = "stv_app_key_" + host + "_" + bookid;
    var obj = { key: key, readcontextid: readcontextid || "", time: new Date().getTime() };
    STV_KEY_CACHE[cacheKey] = obj;
    var str = JSON.stringify(obj);

    try {
        if (typeof cacheStorage !== "undefined" && cacheStorage && typeof cacheStorage.setItem === "function") {
            cacheStorage.setItem(cacheKey, str);
        }
    } catch (e1) {}

    try {
        if (typeof localStorage !== "undefined" && localStorage && typeof localStorage.setItem === "function") {
            localStorage.setItem(cacheKey, str);
        }
    } catch (e2) {}
}

// Xoa khoa doc chuong khi bi het han hoac sai khoa
function clearStoredKey(host, bookid) {
    var cacheKey = "stv_app_key_" + host + "_" + bookid;
    delete STV_KEY_CACHE[cacheKey];

    try {
        if (typeof cacheStorage !== "undefined" && cacheStorage && typeof cacheStorage.removeItem === "function") {
            cacheStorage.removeItem(cacheKey);
        }
    } catch (e1) {}

    try {
        if (typeof localStorage !== "undefined" && localStorage && typeof localStorage.removeItem === "function") {
            localStorage.removeItem(cacheKey);
        }
    } catch (e2) {}
}

var GENRES = [
    { title: "Huyền Huyễn", slug: "category=hh" },
    { title: "Đô Thị", slug: "category=dt" },
    { title: "Ngôn Tình", slug: "category=nt" },
    { title: "Võng Du", slug: "category=vd" },
    { title: "Khoa Huyễn", slug: "category=kh" },
    { title: "Lịch Sử", slug: "category=ls" },
    { title: "Đồng Nhân", slug: "category=dn" },
    { title: "Dị Năng", slug: "category=dna" },
    { title: "Linh Dị", slug: "category=ld" },
    { title: "Light Novel", slug: "category=ln" }
];
