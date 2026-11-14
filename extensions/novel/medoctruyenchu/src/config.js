// config.js — Cau hinh cho extension Me Doc Truyen Chu (medoctruyenchu.net).
//
// Site VN truyen chu (Laravel SSR, khong Cloudflare), kiem chung tu VM
// 2026-11-14:
// - Trang chu 200 (100 KB): muc Truyện Hot (10 truyen co bia), Truyện Mới
//   (40 truyen khong bia, link /truyen/<slug>), Truyện đã hoàn thành
//   (5 truyen). The loai trong nav: 19 muc /the-loai/<slug>.
// - Chi tiet /truyen/<slug>: ten o h3.story-name, bia og:image
//   (/images/stories/<slug_gach_duoi>.jpg), tac gia o meta
//   article:author, mo ta o .story-detail__top--desc (gom ca dong
//   "Tác giả:" / "Thể loại:" / "Edit:" o dau), trang thai o
//   <p><strong>Trạng thái:</strong> <span> ("Full" / "Đang ra").
// - Muc luc phan trang 50 chuong/trang: ?page=N tren URL chi tiet, link
//   phan trang o .pagination__item a[data-url] (tra ve full page, khong
//   phai fragment) — can page.js.
// - Chuong /<slug>/chuong-<N> (co the kem hau to ten chuong): noi dung
//   trong .chapter-content, van ban tho ngan cach bang <br><br>, co the
//   bat dau bang dong "Edit: <ten>" (ghi cong bien tap, giu nguyen).
//   Chuong 1 cua Ta Có Một Toà Đạo Quan: 122 doan, 14.057 ky tu, mo dau
//   "Núi Nhạn Quy ở Giang Nam..."; chuong 177 (cuoi): 422 doan, 61.058
//   ky tu — NOI DUNG THAT + DU, khong preview, khong VIP (0 marker
//   VIP/khoa/dang-nhap tren cac trang da kiem).
// - Tim kiem: trang GET /tim-kiem?key_word=... chi tra khung rong (ket
//   qua khong render phia server); tim kiem that chay qua POST
//   /ajax/search-story (JSON {key_word}, header X-CSRF-TOKEN lay tu
//   window.SuuTruyen.csrfToken tren trang vua GET) — tra JSON
//   {success, stories: [{name, slug, ...}]}. POST nay TREO tu VM
//   (timeout 20s, 2 lan, ca khi co cookie) — co the la tarpit IP
//   datacenter, chi kiem chung duoc tren may that.
// - www.medoctruyenchu.net 301 ve medoctruyenchu.net nen giu trong
//   DOMAIN select. Khong co mirror song nao khac duoc kiem chung.
// - KHAC medoctruyen.vn (#23): site rieng (Laravel, khac backend va
//   giao dien), chi trung thuong hieu "Mê Đọc".
//
// Base Darkrai9x medoctruyenchu v3 (src doc duoc trong plugin.zip) da
// CHET HOAN TOAN (site doi sang Laravel: /tim-truyen, /de-xuat, /search
// deu khong con) — viet moi theo hop dong hien tai, chi giu ten + icon.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://medoctruyenchu.net";

// Domain co the doi trong cai dat nguon (medoctruyenchu.net mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: www 301 ve bare (kiem chung 2026-11-14) — giu lam du phong.
var MIRROR_LIST = ["https://www.medoctruyenchu.net"];

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

// Bo dau tieng Viet de so sanh ten the loai / tag.
function stripDiacritics(s) {
    var t = String(s || "").toLowerCase();
    var map = {
        "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a",
        "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
        "â": "a", "ầ": "a", "ấ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
        "đ": "d",
        "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
        "ê": "e", "ề": "e", "ế": "e", "ể": "e", "ễ": "e", "ệ": "e",
        "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
        "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o",
        "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
        "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
        "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u",
        "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u",
        "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y"
    };
    var out = "";
    for (var i = 0; i < t.length; i++) {
        var c = t.charAt(i);
        out += map[c] || c;
    }
    return out;
}

// 19 the loai cua site (kiem chung live tu nav trang chu 2026-11-14).
var GENRES = [
    { slug: "ngon-tinh", title: "Ngôn Tình" },
    { slug: "co-dai", title: "Cổ Đại" },
    { slug: "tien-hiep", title: "Tiên Hiệp" },
    { slug: "di-gioi", title: "Dị Giới" },
    { slug: "xuyen-khong", title: "Xuyên Không" },
    { slug: "dam-my", title: "Đam Mỹ" },
    { slug: "hai-huoc", title: "Hài Hước" },
    { slug: "nguoc", title: "Ngược" },
    { slug: "do-thi", title: "Đô Thị" },
    { slug: "khac", title: "Khác" },
    { slug: "doan-van", title: "Đoản Văn" },
    { slug: "sung", title: "Sủng" },
    { slug: "lich-su", title: "Lịch Sử" },
    { slug: "huyen-huyen", title: "Huyền Huyễn" },
    { slug: "trong-sinh", title: "Trọng Sinh" },
    { slug: "phuong-tay", title: "Phương Tây" },
    { slug: "linh-di", title: "Linh Dị" },
    { slug: "di-nang", title: "Dị Năng" },
    { slug: "mat-the", title: "Mạt Thế" }
];

// Tim the loai theo ten (khong dau, khong phan biet hoa/thuong).
// Tra ve doi tuong genre hoac null.
function findGenreByName(name) {
    var key = stripDiacritics(name);
    for (var i = 0; i < GENRES.length; i++) {
        if (stripDiacritics(GENRES[i].title) === key) return GENRES[i];
    }
    return null;
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
// Tra {doc} hoac {error} cho HTML, {text} hoac {error} cho text tho,
// {json} hoac {error} cho JSON. Khong retry 403; 429/405 thi ghi
// cooldown, khong dung browser fallback (cung IP, vo ich — quy tac 11).
function mdcFetchDoc(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/") });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Mê Đọc Truyện Chữ", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Mê Đọc Truyện Chữ", pacedHostOf(url), r.cooldownRemainingMs) };
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

// Fetch tra ve text tho (dung de lay CSRF token / JSON). Tra {text}
// hoac {error}. options: {method, headers, body, referer}.
function mdcFetchText(url, options) {
    options = options || {};
    var opts = { referer: options.referer || (BASE_URL + "/") };
    if (options.method) opts.method = options.method;
    if (options.headers) opts.headers = options.headers;
    if (options.body) opts.body = options.body;
    var r = null;
    try {
        r = pacedFetch(url, opts);
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Mê Đọc Truyện Chữ", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Mê Đọc Truyện Chữ", pacedHostOf(url), r.cooldownRemainingMs) };
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
    return { text: txt };
}
