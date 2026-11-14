// config.js — Cau hinh cho extension Xa Lo Sach (xalosach.com).
//
// Site VN truyen dich, kiem chung tu VM 2026-11-14:
// - Trang chu 200 (281 KB): nav the loai 83 muc /the-loai/<slug>.html;
//   muc Truyen Noi Bat (div.story_item_hot), danh sach 50 truyen/trang.
// - Danh sach /danhsach/index.html?status=0&sort=2 (Moi cap nhat),
//   sort=1 (Dang hot), status=2&sort=2 (Moi hoan thanh); phan trang
//   /danhsach/P{N}/index.html?... — tham so ?page=N BI BO QUA (kiem
//   chung: page=2 tra giong het page 1).
// - Trang the loai /the-loai/<slug>.html (50 truyen/trang), phan trang
//   /the-loai/P{N}/<slug>.html?status=-1&sort=0.
// - Chi tiet /<slug>-0.html: ten o h1, tac gia .ten_tacgia, bia
//   .wrap-content-image img, trang thai trong .list-info (Dang tien
//   hanh / Hoan thanh), the loai rieng cua truyen trong .list-info
//   (a[href*="/the-loai/"]), luot xem o view, mo ta trong JSON-LD
//   (script application/ld+json, truong description).
// - Muc luc #danhsachchuong ul.lst-chapter li.chap-item a, 100 chuong/
//   trang, phan trang ?P=N; tong so chuong trong tieu de "Danh sach
//   chuong (N)" (mau: 4078 chuong = 41 trang).
// - Chuong /doc-truyen/<slug>-chuong-<n>.html: noi dung trong
//   #lst_content (text tho ngan cach <br><br>); id chuong 24 hex trong
//   baoloitruyen('...') tren trang chuong; API POST
//   https://5xu.g5manhua.com/api/tieuthuyet/getdetailchuongtieuthuyet
//   {sChapterID} tra noi dung day du (ChapContent) — API nay TREO o
//   buoc TLS tu VM (tarpit IP datacenter, giong tangthuvien), chi kiem
//   chung duoc tren may that; preview tren web co the chi la doan trich
//   khi co khoi app-only (#android / .wrap_taiapp / #hotro).
// - Chuong khoa: API tra ChapStatus=4 hoac ChapContent chua "da bi
//   khoa" / "mo khoa de doc", kem ChapPrice (xu) / ChapPriceByCongHien
//   — toc.js danh dau pay/lock, chap.js bao loi tieng Viet ro rang,
//   KHONG mo khoa.
// - Tim kiem /<slug-khong-dau>/tim-kiem.html?page=N (slugify tu khoa);
//   ket qua tra het trong 1 trang (khong co phan trang).
// - Mirror: chua thay mirror dung duoc; DOMAIN chi co xalosach.com.
// - Base Ivan1hai xalosach_ok v3 (registry-only, zip 12 KB tai tu
//   GitHub raw) dung hop dong cu (let, template literal, return null,
//   .first() truthy, ?page=N sai) — viet lai theo hop dong hien tai +
//   quy tac nha; gop home-content.js + genre-content.js thanh gen.js
//   dung chung; them genre.js doc live (base chi co 15 muc cung, site
//   co 83 muc).
// - Luu y ve file lib: file nay duoc cac script khac tai len, nen
//   KHONG duoc tai them file nao khac o day. Script nao dung helper
//   thi tai truoc theo thu tu: file config.js, file rate-limit.js,
//   file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://xalosach.com";

// API lay noi dung chuong day du (host rieng cua site).
var API_BASE = "https://5xu.g5manhua.com";

// Domain co the doi trong cai dat nguon (xalosach.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Chua co mirror dung duoc (kiem chung 2026-11-14).
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

// --- Fetch co pacing (dung pacedFetch cua file rate-limit.js) -------------
// Tra {doc} hoac {error} cho HTML, {text} hoac {error} cho text tho,
// {json} hoac {error} cho JSON. Khong retry 403; 429/405 thi ghi
// cooldown, khong dung browser fallback (cung IP, vo ich — quy tac 11).
// options: {method, headers, body} (cho POST API).
function xlsFetchDoc(url, referer, options) {
    options = options || {};
    var r = null;
    try {
        var opts = { referer: referer || (BASE_URL + "/") };
        if (options.method) opts.method = options.method;
        if (options.headers) opts.headers = options.headers;
        if (options.body) opts.body = options.body;
        r = pacedFetch(url, opts);
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Xa Lộ Sách", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Xa Lộ Sách", pacedHostOf(url), r.cooldownRemainingMs) };
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

function xlsFetchText(url, referer, options) {
    options = options || {};
    var r = null;
    try {
        var opts = { referer: referer || (BASE_URL + "/") };
        if (options.method) opts.method = options.method;
        if (options.headers) opts.headers = options.headers;
        if (options.body) opts.body = options.body;
        r = pacedFetch(url, opts);
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Xa Lộ Sách", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Xa Lộ Sách", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!text) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { text: text };
}

function xlsFetchJson(url, referer, options) {
    var t = xlsFetchText(url, referer, options);
    if (t.error) return { error: t.error };
    var data = null;
    try {
        data = JSON.parse(t.text);
    } catch (e) {
        return { error: "Không đọc được dữ liệu JSON: " + url };
    }
    return { json: data };
}
