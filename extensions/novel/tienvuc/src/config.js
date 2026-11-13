// config.js — Cau hinh cho extension Tien Vuc (tienvuc.blog).
//
// Site VN (truyen dich online), Nuxt SSR + API JSON rieng, khong can dang
// nhap, khong Cloudflare challenge (kiem chung tu VM 2026-11-13: curl
// khong UA cung tra 200 day du). Mirror tienvuc.me tra cung noi dung
// (kiem chung 2026-11-13: /api/categories/all + /api/reading/de-ba giong
// het .blog) — dua vao config DOMAIN select.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://tienvuc.blog";

// Domain co the doi trong cai dat nguon (tienvuc.blog mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: tienvuc.me tra cung noi dung voi .blog (kiem chung 2026-11-13).
// fetch() se theo redirect neu mirror doi domain; helper thu mirror khi
// domain chinh loi.
var MIRROR_LIST = [
    "https://tienvuc.me"
];

// Chuan hoa URL ve dang tuyet doi tren domain dang chon.
function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

// Goi gon khoang trang thua.
function cleanText(text) {
    if (!text) return "";
    return String(text).replace(/\s+/g, " ").trim();
}

// Dem so phan tu cua 1 tap hop jsoup (size() co the la ham hoac so).
function getSize(els) {
    if (!els) return 0;
    try {
        if (typeof els.size === "function") return els.size();
        if (typeof els.size === "number") return els.size;
        if (typeof els.length === "number") return els.length;
    } catch (e) {
    }
    return 0;
}

// Boc tach HTML thanh text thuan (gioi thieu truyen cua site chua the <p>).
function stripHtml(html) {
    if (!html) return "";
    var t = String(html).replace(/<br\s*\/?>/gi, "\n");
    t = t.replace(/<\/p>/gi, "\n");
    t = t.replace(/<[^>]+>/g, "");
    t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
    return cleanText(t);
}

// Lay slug truyen tu URL trang chi tiet (dang /<slug>, app cat "/" cuoi).
function slugOf(url) {
    url = String(url || "").trim().split("?")[0].split("#")[0];
    var parts = url.split("/");
    var slug = parts[parts.length - 1] || "";
    if (!slug && parts.length > 1) slug = parts[parts.length - 2] || "";
    return slug;
}
