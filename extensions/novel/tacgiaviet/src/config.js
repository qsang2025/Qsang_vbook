// config.js — Cau hinh cho extension TacGiaViet (tacgiaviet.com).
//
// Site VN (Laravel, SSR), thuoc cong dong Bach Ngoc Sach. Kiem chung tu VM
// 2026-11-14:
// - Khong chan bot theo UA: curl UA mac dinh tra 200 o trang chu, chi tiet,
//   chuong, tim kiem. Nen dung UA mac dinh cua runtime (quy tac 10
//   AGENTS.md), khong set UA rieng.
// - Trang chi tiet /truyen/<slug>; chuong /truyen/<slug>/<chuong-slug>;
//   noi dung chuong day du trong div.reading-content (chuong 1 truyen mau:
//   316 doan <p>, mo dau "HOI 1: Ngay mo son mon").
// - Muc luc phan trang 20 chuong/trang, ?chapters_page=N (truyen mau 134
//   chuong = 7 trang); page.js tra danh sach URL trang muc luc, toc.js doc
//   tung trang.
// - Site co he mo khoa chuong (tien mo khoa chuyen truc tiep cho tac gia,
//   website khong giu tien): chuong da mo co icon is-unlocked; chuong khoa
//   co is-locked. toc.js danh dau lock/pay khi gap is-locked; chap.js tra
//   loi tieng Viet ro rang khi khong co noi dung, khong mo khoa.
// - Tab BTV de cu theo thang dang RONG (0 tac pham) — home.js dung
//   /btv-de-cu?period=all (17 tac pham, 12/trang).
// - Tim kiem GET /tim-kiem?q=<tu khoa>&type=stories[&page=N]; &page=1 bi
//   301 ve khong co page nen chi them page khi > 1.
// - Khong co mirror da kiem chung. Chi dung domain chinh.
// - Anh bia: /storage/covers/responsive/<kich co>/<uuid>-<hash>.webp.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://tacgiaviet.com";

// Domain co the doi trong cai dat nguon (tacgiaviet.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung. Chi dung domain chinh.
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

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// Lay phan tu dau tien cua mot select (tranh bay .first() cua runtime:
// select rong van tra ve object truthy — xem FIRST-QUIRK-AUDIT.md).
function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

// --- Fetch co pacing (dung pacedFetch cua file rate-limit.js) -------------
// Tra {doc} hoac {error}. Khong retry 403; 429/405 thi ghi cooldown, khong
// dung browser fallback (cung IP, vo ich — quy tac 11 AGENTS.md).
function ttlFetchDoc(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/") });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Tác Giả Việt", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Tác Giả Việt", pacedHostOf(url), r.cooldownRemainingMs) };
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

// Token trang ke: so trang tiep theo (chuoi), "" khi het. Tim link
// a[rel=next] roi lay so page trong href.
function nextPageToken(doc) {
    var next = selFirst(doc, "a[rel=next]");
    if (!next) return "";
    var href = next.attr("href") || "";
    var m = /[?&]page=(\d+)/.exec(href);
    return m ? m[1] : "";
}

// Them ?page=N hoac &page=N vao URL (giu nguyen query hien co).
function appendPage(url, page) {
    var p = parseInt(page, 10);
    if (isNaN(p) || p <= 1) return url;
    return url + (url.indexOf("?") === -1 ? "?page=" + p : "&page=" + p);
}
