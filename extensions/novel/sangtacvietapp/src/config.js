// config.js — Cau hinh domain va caching cho SangtacvietApp
//
// BASE_URL mac dinh la domain chinh (.app). Cac domain .vip / .com / .pro
// la mirror that cua cung mot site (chung mot backend 103.82.20.93).
// Thu tu mirror moi (AG §6.3, doi 2026-11-10): .pro len dau — di thang
// origin, khong qua Cloudflare (da kiem chung bang Server header:
// .app/.vip tra "Server: cloudflare", .com/.pro tra "Server: nginx/1.18.0").
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

var MIRROR_LIST = ["https://sangtacviet.pro", "https://sangtacviet.vip", "https://sangtacviet.com"];

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

// --- Smart Quick-Retry + micro-cooldown cho loi gateway 502/504 (AG §6.1/§6.2) --
// 502/504 la loi qua tai nhat thoi cua backend STV (micro-burst, tu het sau
// 1-2 phut), KHAC voi 405/429 la chan co y theo IP:
// - 405/429: cooldown dai 60 phut trong rate-limit.js (pacedFetch tu ghi).
// - 502/504: TUYET DOI KHONG cooldown dai; chi micro-cooldown 20 giay de
//   tranh bam tai lai lien tuc khi may chu vua sap. Luu trong localStorage
//   (rieng tung extension) duoi khoa stv_gw_<host> = "until|status".
// - Smart Quick-Retry (§6.1): gap 502/504 thi ngu 2,5s roi thu DUY NHAT 1 lan
//   sang mirror ke tiep (thu tu moi: .pro dau tien — di thang origin, khong
//   qua Cloudflare), timeout 6s cho lan thu lai; van loi thi tra loi nhu cu.
//   Tong cho them toi da ~12s, khong phai 138s nhu co che cu.
var STV_GW_COOLDOWN_MS = 20000;
var STV_GW_RETRY_SLEEP_MS = 2500;
var STV_GW_RETRY_TIMEOUT_MS = 6000;
var STV_LAST_GATEWAY = null;

function stvGwKey(host) {
    return "stv_gw_" + String(host || "").replace(/[^A-Za-z0-9._-]/g, "_");
}

function setGatewayCooldown(host, ms, status) {
    try {
        if (typeof localStorage === "undefined" || !localStorage || !host) return false;
        var dur = STV_GW_COOLDOWN_MS;
        if (typeof ms === "number" && !isNaN(ms) && ms > 0) dur = Math.floor(ms);
        var st = (status === 502 || status === 504) ? status : 504;
        localStorage.setItem(stvGwKey(host), String(Date.now() + dur) + "|" + st);
        return true;
    } catch (e) {
        return false;
    }
}

// Con bao nhieu ms nua moi het micro-cooldown gateway (0 = khong co / het han).
function gatewayCooldownRemainingMs(host) {
    try {
        if (typeof localStorage === "undefined" || !localStorage || !host) return 0;
        var raw = localStorage.getItem(stvGwKey(host));
        if (!raw) return 0;
        var until = parseInt(String(raw).split("|")[0], 10);
        if (isNaN(until)) return 0;
        var remain = until - Date.now();
        return remain > 0 ? remain : 0;
    } catch (e) {
        return 0;
    }
}

// Ma HTTP 502/504 da luu cung micro-cooldown (mac dinh 504 neu khong doc duoc).
function gatewayCooldownStatus(host) {
    try {
        if (typeof localStorage === "undefined" || !localStorage || !host) return 504;
        var raw = localStorage.getItem(stvGwKey(host));
        if (!raw) return 504;
        var parts = String(raw).split("|");
        if (parts.length < 2) return 504;
        var s = parseInt(parts[1], 10);
        return (s === 502 || s === 504) ? s : 504;
    } catch (e) {
        return 504;
    }
}

// Thong bao loi tieng Viet than thien cho 502/504 (AG §6.4); tra null voi ma khac.
function stvGatewayErrorMessage(status) {
    if (status !== 502 && status !== 504) return null;
    return "Máy chủ Sáng Tác Việt đang quá tải hoặc gặp chậm trễ khi lấy dữ liệu từ nguồn gốc (HTTP " + status + "). " +
        "Vui lòng thử lại sau vài giây hoặc đổi sang tên miền https://sangtacviet.pro trong Cài đặt.";
}

// Tach host (viet thuong) tu URL; tra "" neu khong tach duoc.
function stvHostOf(url) {
    try {
        var hm2 = String(url || "").match(/^https?:\/\/([^\/:?#]+)/i);
        return hm2 ? hm2[1].toLowerCase() : "";
    } catch (e) {
        return "";
    }
}

// Nghi ms mili-giay (dung cho Smart Quick-Retry): uu tien rlSleepMs cua
// rate-limit.js, neu chua nap thi dung sleep() cua runtime, khong co thi bo qua.
function stvSleepMs(ms) {
    try {
        if (typeof rlSleepMs === "function") { rlSleepMs(ms); return; }
    } catch (e) {}
    try {
        if (typeof sleep !== "undefined" && sleep) sleep(ms);
    } catch (e2) {}
}

// Tra thong bao "tam chan" neu host vua bi chan 405/429 va van trong thoi
// gian cooldown; nguoc lai tra null. Chi goi o nhanh loi (res null hoac
// !res.ok), khong goi khi da success.
function stvBlockedMessage() {
    try {
        // Loi gateway 502/504 vua xay ra (trong lan execute nay, hoac lan
        // truoc trong vong micro-cooldown 20s): bao than thien thay vi loi HTTP.
        if (STV_LAST_GATEWAY && STV_LAST_GATEWAY.host) {
            var gwRemain = gatewayCooldownRemainingMs(STV_LAST_GATEWAY.host);
            if (gwRemain > 0) {
                var gwMsg = stvGatewayErrorMessage(STV_LAST_GATEWAY.status);
                if (gwMsg) return gwMsg;
            }
        }
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

// Fetch co failover qua mirror + pacing chong rate-limit (I3/I4 + AG §6.1/§6.2):
// - Moi request deu qua pacedFetch() (lib/rate-limit.js, can script goi nap
//   rate-limit.js truoc): kiem tra cooldown truoc, nghi jitter 0,5-1,5s,
//   fetch 1 lan duy nhat (maxRetries: 0).
// - (I3) Da nhan HTTP response (ke ca 4xx/5xx) thi tra ngay, KHONG thu
//   mirror tiep — NGOAI TRU 502/504 (xem Smart Quick-Retry ben duoi).
//   Chi failover khi fetch nem exception hoac khong co response (loi mang).
// - (I4) Gap 405/429 thi pacedFetch tu ghi cooldown (60 phut mac dinh);
//   lan goi sau trong cooldown se fail nhanh, khong gui request.
// - (AG §6.1) Smart Quick-Retry: gap 502/504 thi ngu 2,5s roi thu DUY NHAT
//   1 lan sang mirror ke tiep (thu tu moi: .pro dau tien), timeout 6s cho
//   lan thu lai; van loi thi tra loi nhu cu. Tong cho them toi da ~12s.
// - (AG §6.2) 502/504 TUYET DOI KHONG cooldown dai: chi micro-cooldown 20s
//   (khoa stv_gw_<host> trong localStorage); 405/429 giu nguyen 60 phut.
// - Chi failover khi URL thuoc mot origin STV da biet (BASE_URL hoac mirror).
// - Khi mot mirror tra ok, gan BASE_URL = mirror do de cac buoc sau trong
//   cung lan execute() (detail -> toc -> chap) o cung origin.
function fetchWithMirrors(url, options) {
    var originMatch = String(url).match(/^https?:\/\/[^\/]+/);
    var origin = originMatch ? originMatch[0] : "";
    var originHost = stvHostOf(origin);
    // (AG §6.2) Host vua tra 502/504 trong vong 20s: fail nhanh, khong gui
    // request moi; caller hien thong bao than thien qua stvBlockedMessage().
    if (originHost && gatewayCooldownRemainingMs(originHost) > 0) {
        STV_LAST_GATEWAY = { host: originHost, status: gatewayCooldownStatus(originHost) };
        return null;
    }
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
    // Trang thai Smart Quick-Retry (AG §6.1): chi 1 lan retry cho 502/504.
    var retriedGateway = false;
    var gatewayFirstRes = null;
    var gatewayFirstStatus = 0;
    var gatewayFirstHost = "";
    for (var i = 0; i < bases.length; i++) {
        var tryUrl = url;
        if (i > 0) {
            tryUrl = String(url).replace(/^https?:\/\/[^\/]+/, bases[i]);
        }
        var host = stvHostOf(tryUrl);
        var isRetryAttempt = retriedGateway && gatewayFirstRes !== null;
        // Duong chinh: pacedFetch (can script goi nap rate-limit.js truoc).
        if (typeof pacedFetch === "function") {
            var r = null;
            try {
                var pfOpts = {
                    method: (options && options.method) || "GET",
                    headers: (options && options.headers) || null,
                    body: (options && options.body) || null,
                    maxRetries: 0
                };
                if (isRetryAttempt) pfOpts.timeout = STV_GW_RETRY_TIMEOUT_MS;
                r = pacedFetch(tryUrl, pfOpts);
            } catch (ePaced) {
                r = null;
            }
            if (r && r.error === "cooldown") {
                STV_LAST_BLOCKED = { host: host, remainingMs: r.cooldownRemainingMs || 0 };
                if (gatewayFirstRes) {
                    setGatewayCooldown(gatewayFirstHost, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
                    STV_LAST_GATEWAY = { host: gatewayFirstHost, status: gatewayFirstStatus };
                    return gatewayFirstRes;
                }
                return null;
            }
            if (r && r.res) {
                var st = 0;
                try { st = r.status || 0; } catch (eSt) { st = 0; }
                // (AG §6.1) Gap 502/504: ngu 2,5s roi thu DUY NHAT 1 lan sang
                // mirror ke tiep (thu tu moi: .pro dau tien) — tru khi mirror
                // do vua sap trong vong 20s thi bo qua retry.
                var shouldRetry = (st === 502 || st === 504) && !retriedGateway && i + 1 < bases.length;
                if (shouldRetry && gatewayCooldownRemainingMs(stvHostOf(bases[i + 1])) > 0) shouldRetry = false;
                if (shouldRetry) {
                    retriedGateway = true;
                    gatewayFirstRes = r.res;
                    gatewayFirstStatus = st;
                    gatewayFirstHost = host;
                    stvSleepMs(STV_GW_RETRY_SLEEP_MS);
                    continue;
                }
                if (st === 502 || st === 504) {
                    setGatewayCooldown(host, STV_GW_COOLDOWN_MS, st);
                    if (gatewayFirstHost) setGatewayCooldown(gatewayFirstHost, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
                    STV_LAST_GATEWAY = { host: host, status: st };
                }
                if (st === 429 || st === 405) {
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
            // Khong co response (loi mang): neu vua retry gateway ma mirror
            // retry khong tra ve gi thi tra lai response 502/504 goc.
            if (gatewayFirstRes) {
                setGatewayCooldown(gatewayFirstHost, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
                setGatewayCooldown(host, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
                STV_LAST_GATEWAY = { host: gatewayFirstHost, status: gatewayFirstStatus };
                return gatewayFirstRes;
            }
            continue;
        }
        // Fallback khi rate-limit.js chua duoc load: fetch thuong + pacing
        // neu co, giu nguyen ngu nghia I3 (co response thi tra ngay).
        if (typeof rateLimitDelay === "function") {
            try { rateLimitDelay(host); } catch (eDL) {}
        }
        var res = null;
        try {
            var fOpts = options || {};
            if (isRetryAttempt) {
                fOpts = {};
                if (options) {
                    for (var fKey in options) {
                        try { fOpts[fKey] = options[fKey]; } catch (eCopy) {}
                    }
                }
                fOpts.timeout = STV_GW_RETRY_TIMEOUT_MS;
            }
            res = fetch(tryUrl, fOpts);
        } catch (e) {
            res = null;
        }
        if (res) {
            var st2 = 0;
            try { st2 = res.status || 0; } catch (eSt2) { st2 = 0; }
            if ((st2 === 502 || st2 === 504) && !retriedGateway && i + 1 < bases.length) {
                var shouldRetry2 = gatewayCooldownRemainingMs(stvHostOf(bases[i + 1])) <= 0;
                if (shouldRetry2) {
                    retriedGateway = true;
                    gatewayFirstRes = res;
                    gatewayFirstStatus = st2;
                    gatewayFirstHost = host;
                    stvSleepMs(STV_GW_RETRY_SLEEP_MS);
                    continue;
                }
            }
            if (st2 === 502 || st2 === 504) {
                setGatewayCooldown(host, STV_GW_COOLDOWN_MS, st2);
                if (gatewayFirstHost) setGatewayCooldown(gatewayFirstHost, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
                STV_LAST_GATEWAY = { host: host, status: st2 };
            }
            if (st2 === 429 || st2 === 405) {
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
        if (gatewayFirstRes) {
            setGatewayCooldown(gatewayFirstHost, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
            setGatewayCooldown(host, STV_GW_COOLDOWN_MS, gatewayFirstStatus);
            STV_LAST_GATEWAY = { host: gatewayFirstHost, status: gatewayFirstStatus };
            return gatewayFirstRes;
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
