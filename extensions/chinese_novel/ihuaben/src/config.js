// config.js — Cau hinh cho extension IHuaBen (ihuaben.com).
//
// Site CN (PHP, SSR), chuyen dong nhan / truyen goc mien phi. Kiem chung
// tu VM 2026-11-14:
// - GET trang chu / /girl/ / /boy/ / /tongren/ / chi tiet / chuong /
//   so.ihuaben.com/search tra 200, khong chan bot theo UA (curl UA mac
//   dinh). Dung UA mac dinh cua runtime (quy tac 10 AGENTS.md), khong set
//   UA rieng.
// - ihuaben.com 301 -> www.ihuaben.com; domain mac dinh la www.
// - Trang chu: 6 khoi .cover-list, moi li co h4 a (ten), img (bia),
//   .text-lightgrey (tagline).
// - The loai: /girl/ /boy/ /tongren/ moi trang co 1 <li class="sublist">
//   chua cac link the loai (/xiandai/, /gudai/, ...); danh sach truyen
//   theo the loai qua {url}/clickcount_days_7/{page}.html, 30 truyen/trang,
//   card .booklist li (h3 a = ten, img = bia, .text-lightgrey = tac gia).
// - Tim kiem: GET https://so.ihuaben.com/search?keyword=<tu>&page=N&
//   pageSize=100, ket qua .searchresult (h2 a = ten, co <em> highlight;
//   .searchresult-info p = mo ta); phan trang .pagination .active + a.
// - Trang chi tiet /book/<id>.html: ten h1 trong .biginfo, bia .cover img,
//   tac gia link a[href^='//user'] (link dau la avatar, lay link co text),
//   trang thai label.bg-dwarning ("连载" = dang ra, "完结" = hoan thanh),
//   mo ta .aboutbook (bat dau bang "简介：").
// - Muc luc: GET /list/<id>.html?sortType=0&pageSize=99999 tra TOAN BO
//   chuong trong 1 lan (tham so pageSize bi site bo qua — kiem chung
//   pageSize=5 van tra du 726 chuong); hang .chapter-row a. Khong can
//   page.js (khong co phan trang muc luc). Tong so chuong trong JS inline
//   totalChapterCount.
// - Chuong: noi dung trong #contentsource, cac doan <p class="dp">; moi
//   doan kem <i class="num"> (so luong binh luan) va xen ke cac khoi
//   <div class="passage-cosplay-preview"> chua 段评 (binh luan doan van)
//   — chap.js go bo ca hai truoc khi tra ve. Tieu de chuong: h1.
// - Khong co chuong VIP/lock gap tren cac mau live (chuong doc du).
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://www.ihuaben.com";

// Domain co the doi trong cai dat nguon (www.ihuaben.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: ihuaben.com (khong www) 301 ve www.ihuaben.com.
var MIRROR_LIST = ["https://ihuaben.com"];

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
    if (!r.ok) return { error: rateLimitErr("话本小说", url, r) };
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}
