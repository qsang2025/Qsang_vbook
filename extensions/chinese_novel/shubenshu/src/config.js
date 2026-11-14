// config.js — Cau hinh cho extension 书本书 (shubenshu.com).
//
// Site CN (Empire CMS, SSR), truyen chu mien phi. Kiem chung tu VM 2026-11-14:
// - GET trang chu / /list_1/ / chi tiet /lCps/ / chuong /lCps/TKnG7.html /
//   muc luc /lCps_list/ tra 200, khong chan bot theo UA (curl UA mac dinh).
//   Dung UA mac dinh cua runtime (quy tac 10 AGENTS.md), khong set UA rieng.
// - shubenshu.com 301 -> https://www.shubenshu.com/; domain mac dinh la www.
// - The loai: 10 muc /list_1/ .. /list_10/ o nav.nav trang chu; danh sach
//   truyen theo the loai qua /list_N/ (21 truyen/trang, khoi .l "最近更新"),
//   phan trang /list_N_M/.
// - Tim kiem: POST /e/search/ (keyboard + show=title,ftitle,writer), tra 302
//   ve /e/search/result/?searchid=N — app khong tu theo redirect cua POST
//   nen search.js doc Location roi fetch tiep. POST nay treo tu VM (timeout
//   60s, 2 lan) — co the la tarpit theo IP datacenter, can kiem chung tren
//   may that; neu tren may cung treo thi bo search.js, giu TOC + chuong.
// - Trang chi tiet /lXXX/: ten h1 trong #info, bia #fmimg img
//   (data-original = /newpics/lXXX.jpg), tac gia a[href^=/author/], mo ta
//   #intro, thong ke p.hidden-xs ("*人读过 | N章节 | N万字 | 连载/完结").
// - Muc luc: GET /{id}_list/ tra TOAN BO chuong trong 1 lan (1341 chuong
//   o mau), hang #list a[rel=chapter]; co 1 link honeypot bot_test.php an
//   (display:none) phai loc bo. Khong can page.js.
// - Chuong: noi dung trong #booktxt, cac doan <p> sach; chuong dai tach
//   thanh <id>_2.html, <id>_3.html... (tieu de h1.bookname kem "(N/M)");
//   cuoi trang giua co doan "本章未完，点击下一页继续阅读。" can cat bo.
// - Khong co chuong VIP/lock gap tren cac mau live (chuong doc du).
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://www.shubenshu.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: shubenshu.com (khong www) 301 ve www.shubenshu.com.
var MIRROR_LIST = ["https://shubenshu.com"];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = String(MIRRORS).split(",");
        var cleaned = [];
        for (var mi = 0; mi < injected.length; mi++) {
            var mu = injected[mi].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (mu && mu !== BASE_URL) cleaned.push(mu);
        }
        if (cleaned.length > 0) MIRROR_LIST = cleaned;
    }
} catch (e2) {
}

function normalizeUrl(raw) {
    var u = String(raw || "").trim();
    if (!u) return "";
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.indexOf("http") !== 0) {
        if (u.charAt(0) !== "/") u = "/" + u;
        return BASE_URL + u;
    }
    // Cung site, khac host (www / khong www / http): doi ve BASE_URL.
    var m = u.match(/^https?:\/\/[^\/]*shubenshu\.com(\/.*)?$/i);
    if (m) return BASE_URL + (m[1] || "/");
    return u;
}

function absUrl(href) {
    if (!href) return "";
    return normalizeUrl(href);
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// Lay phan tu dau tien cua mot select (tranh bay .first() cua runtime:
// select rong van tra ve object truthy — xem FIRST-QUIRK-AUDIT.md).
function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

// Danh sach truyen khong co <img>; bia nam o duong dan co dinh theo id
// truyen (/lCps/ -> /newpics/lCps.jpg).
function coverOf(link) {
    var m = String(link || "").match(/\/(l[A-Za-z0-9]+)\/?$/);
    return m ? BASE_URL + "/newpics/" + m[1] + ".jpg" : "";
}

function rateLimitErr(siteName, url, r) {
    if (r && r.error === "cooldown") {
        return rateLimitErrorMessage(siteName, pacedHostOf(url), r.cooldownRemainingMs);
    }
    if (r && (r.status === 429 || r.status === 405)) {
        return rateLimitErrorMessage(siteName, pacedHostOf(url), r.cooldownRemainingMs);
    }
    if (r && r.status) return "Không tải được dữ liệu (HTTP " + r.status + "): " + url;
    return "Không tải được dữ liệu (lỗi mạng): " + url;
}

// --- Fetch GET co pacing ----------------------------------------------------
// Tra {doc} hoac {error}.
function ttlFetchDoc(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/") });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (!r.ok) return { error: rateLimitErr("书本书", url, r) };
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}
