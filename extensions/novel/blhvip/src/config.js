// config.js — Cau hinh cho extension Ban Long (blhvip.vn).
//
// Site VN truyen chu full dich (SSR + API JSON rieng), kiem chung tu VM
// 2026-11-14:
// - Trang chu 200 (198 KB), SSR day du; the loai trong .modal-story-genre
//   (57 muc); danh sach .basis-full > .novel-item (12/trang, ?page=N).
// - Chi tiet /truyen/<slug>; muc luc qua API
//   /v1/story/<slug>/chapter_list?new=0&page=N (50 chuong/trang,
//   total_page trong JSON); chuong /truyen/<slug>/chuong-N, noi dung trong
//   #chapter-content .published-content.
// - Tim kiem qua API /v1/search?q=<tu khoa>&page=N — chay ca co dau va
//   khong dau (kiem chung: "van dao" va "vạn đạo" deu ra Van Dao Truong Do).
// - Khong Cloudflare, khong can dang nhap de doc chuong thuong. Chuong VIP
//   co co is_vip trong API muc luc + .content-lock o trang chuong — chi bao
//   loi tieng Viet ro rang, khong mo khoa (chua gap mau VIP live).
// - www.blhvip.vn 301 ve blhvip.vn nen giu trong DOMAIN select.
// - Khong co mirror song nao khac duoc kiem chung.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://blhvip.vn";

// Domain co the doi trong cai dat nguon (blhvip.vn mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// API host: api.blhvip.vn (thay www. / goc bang api.).
var API_URL = BASE_URL.replace(/^(https?:\/\/)(?:www\.)?/, "$1api.");

// Khong co mirror song nao khac duoc kiem chung. Chi dung domain chinh.
var MIRROR_LIST = [];

function normalizeUrl(raw) {
    var u = String(raw || "").trim();
    if (!u) return "";
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.indexOf("http") !== 0) {
        if (u.charAt(0) !== "/") u = "/" + u;
        return BASE_URL + u;
    }
    return u.replace(/([^:])\/\/+/g, "$1/");
}

function absUrl(href) {
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

function storySlug(url) {
    var m = /\/truyen\/([^\/\?#]+)/.exec(String(url || ""));
    return m ? m[1] : "";
}

// Ma hoa tu khoa tim kiem cho query string.
function encodeKey(key) {
    var q = String(key || "").trim();
    try {
        return encodeURIComponent(q).replace(/%20/g, "+");
    } catch (e) {
        return q.split(" ").join("+");
    }
}

// --- Fetch co pacing (dung pacedFetch cua file rate-limit.js) -------------
// Tra {doc} hoac {error} cho HTML, {json} hoac {error} cho JSON.
// Khong retry 403; 429/405 thi ghi cooldown, khong dung browser fallback
// (cung IP, vo ich — quy tac 11 AGENTS.md).
function blhFetchDoc(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/") });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Bàn Long", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Bàn Long", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}

function blhFetchJson(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/") });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Bàn Long", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Bàn Long", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var txt = "";
    try {
        txt = r.res.text() + "";
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    var json = null;
    try {
        json = JSON.parse(txt);
    } catch (e3) {
        return { error: "Không đọc được dữ liệu (site trả về không phải JSON): " + url };
    }
    return { json: json };
}

// Token trang ke: so trang tiep theo (chuoi), "" khi het.
// Tim link a.next-page roi lay so page trong href.
function nextPageToken(doc) {
    var next = selFirst(doc, "a.next-page");
    if (!next) return "";
    var href = next.attr("href") || "";
    var m = /[?&]page=(\d+)/.exec(href);
    return m ? m[1] : "";
}
