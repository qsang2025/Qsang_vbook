// config.js — Cau hinh domain cho Sang Tac Viet
//
// BASE_URL mac dinh la domain chinh (.app). Cac domain .vip / .com / .pro
// la mirror that cua cung mot site (da kiem chung bang curl 2026-11-08:
// ca 4 domain deu tra HTTP 200 va phuc vu duoc API muc luc). Khi domain
// chinh chet, fetchWithMirrors() tu thu lan luot cac mirror trong
// MIRROR_LIST va nho mirror dang chay (gan lai BASE_URL) cho cac buoc sau
// trong cung mot lan execute() — quan trong voi chap.js vi grant + key +
// read phai o cung mot origin (cookie readcontextid gan voi origin).
//
// Domain dns1.stv-appdomain-<so>.org chi co trong regexp cua plugin.json
// (de app van mo duoc link thu vien cu); tu VM khong ket noi duoc toi no
// (resolve ra IP dai CGNAT 198.18.x, ket noi timeout — kiem chung lai
// 2026-11-09: dns1.stv-appdomain-1.org resolve 198.18.112.197, curl
// HTTP 000) nen KHONG dua vao MIRROR_LIST — khong che failover gia.
// Giu nguyen regexp; chi can nhac them vao mirror neu co bao cao link
// thu vien cu mo duoc tren may that.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
var BASE_URL = "https://sangtacviet.app";

// So item toi da mot trang tra ve tu API tim kiem / danh sach cua STV
// (dem that tu HTML tra ve: 48 muc/trang, khong co phan tu phan trang nao
// trong HTML — selector ".pagination" cu khong ton tai). search.js /
// gen.js dung con so nay de biet con trang sau hay khong: du 48 muc thi
// next = so trang tiep theo, it hon thi next = "" (het).
var PAGE_SIZE = 48;

// --- Cac hang so cua co che doc chuong STV (chap.js) ---------------------
// Cac ten nay xuat phat tu ma grant do may chu STV tra ve (chuoi ma hoa
// trong script cua site, quan sat duoc 2026-11-08). Chung la ten thuoc
// tinh cua doi tuong gia lap (fake window) ma ma grant doc de sinh
// chapterkey — neu site doi ten thi phai cap nhat theo ma grant moi.
// Giu nguyen gia tri, chi tach ra thanh hang co ten ro rang.
var STV_GRANT_FLAG_WINDOW = "UWNgB"; // co tren window: window.UWNgB = true
var STV_GRANT_FLAG_APP = "tcYCI";    // co tren window.app: app.tcYCI = true

// Muoi (salt) noi vao cuoi chuoi ky truoc khi MD5 de tao header
// x-stv-sign cho API doc chuong. Gia tri nay do phia STV quy dinh (quan
// sat duoc tu luong goi API cua app that); neu server xoay muoi thi API
// doc se tra ma loi — chap.js bao loi do ra chu khong tu doan muoi moi.
var STV_SIGN_SALT = "erogh982^%*%^*";

// UA nay CHI dung trong WebView sandbox noi ma grant chay (gia lap
// navigator.userAgent + browser.setUserAgent) vi ma grant da duoc kiem
// chung chay dung voi gia tri nay tren may that (2026-11-08). Cac lenh
// fetch() HTTP KHONG duoc set header User-Agent — de runtime dung UA mac
// dinh (AGENTS.md muc 6 quy tac 10: Cloudflare gan cookie cf_clearance
// voi UA cua trinh duyet da qua xac minh).
var STV_WEBVIEW_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

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
// Do tre tu VM: 2026-11-08 .com cham bat thuong (7,8s) trong khi .pro
// 2,0s; do lai 2026-11-09: .app 0,9s, .vip 3,9s, .com 2,1s, .pro 2,1s
// — .com khong cham on dinh nen GIU NGUYEN thu tu .vip -> .com -> .pro,
// tiep tuc theo doi, chua doi thu tu chi vi mot lan do cham.
var MIRROR_LIST = ["https://sangtacviet.vip", "https://sangtacviet.com", "https://sangtacviet.pro"];

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
// - Chi failover khi URL thuoc mot origin STV da biet (BASE_URL hoac mirror)
//   — URL la khong thay origin lung tung.
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

var GENRES = [
    { title: "Huyền Huyễn", slug: "category=hh" },
    { title: "Đô Thị", slug: "category=dt" },
    { title: "Võng Du", slug: "category=vd" },
    { title: "Khoa Huyễn", slug: "category=kh" },
    { title: "Dị Năng", slug: "category=dna" },
    { title: "Đồng Nhân", slug: "category=dn" },
    { title: "Linh Dị", slug: "category=ld" },
    { title: "Ngôn Tình", slug: "category=nt" }
];
