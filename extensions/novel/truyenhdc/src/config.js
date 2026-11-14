// config.js — Cau hinh cho extension TruyenHD (truyenhdc.com).
//
// Site VN truyen chu (WordPress, SSR + API JSON rieng), kiem chung tu VM
// 2026-11-14:
// - Trang chu 200 (90 KB): cac muc Thong Bao / Doc Quyen / Chuong Moi /
//   Kim Thanh Bang / Bang Xep Hang / Moi Cap Nhat; nav the loai 34 muc
//   /keyword/<slug>.
// - Danh sach /truyen-dich va /truyen-sang-tac: bang SSR
//   table.theloai-thumlist (18 truyen/trang), nut "Xem Them Truyen"
//   data-maxpage 231 / 340 — trang sau qua POST admin-ajax
//   load_more_page_keyword (treo tu VM, kiem chung tren may that).
// - Trang the loai /keyword/<slug> KHONG co SSR (chi skeleton) — danh
//   sach qua API GET https://s1apihd.com/wp-json/v1/app/cache/book
//   ?post=12&page=N&taxonomy=keyword&slug=<slug>&filter=new-chap,
//   tra JSON [{slug, title, thumbnail, excerpt, time, full}]. API host
//   nay cat TLS handshake tu VM (000), chi kiem chung duoc tren may
//   that; h1 trang the loai co data-api="s1apihd.com".
// - Chi tiet /truyen/<slug>/: ten o h1, tac gia o .item-user (attr
//   title), bia .book3d img (data-src), mo ta o .excerpt-full (an,
//   du) / .excerpt-collapse (cat ngan), thong tin o #thong_tin
//   (Tinh Trang: Hoan Thanh / Dang Cap Nhat; the loai o .keywords a),
//   JSON-LD Book co description day du. Tac gia khong co link
//   tac-gia rieng.
// - Muc luc: #dsc ul.listchap li, 50 chuong/trang, phan trang bang
//   .pagination li[data-id] (mau: 7 trang); chuong VIP co img
//   alt="vip" trong dong (mau: ch.31-50 VIP, ch.1-30 thuong). Lay
//   trang sau qua POST admin-ajax user_truyen_pagination.
// - Chuong /truyen/<slug>/chap/<id>-chuong-<n>/: noi dung trong
//   .reading, text tho ngan cach <br><br> (ch.1 mau: 2.917 ky tu, mo
//   dau "Lao xao. Nhat Da than trong re dam co dai..."). Tieu de o
//   <title> ("Ten truyen - Chuong N: ...").
// - Tim kiem GET /tim-kiem/?title=<key> (SSR, li.col-md-6), phan
//   trang /tim-kiem/page/<n>?title=<key>.
// - Mirror: truyenhd.com chi la lander (114 B), truyenvkl.com 403,
//   truyenhdt.com 000 — khong co mirror dung duoc; DOMAIN chi co
//   truyenhdc.com.
// - Site co chuong VIP (nut mua chuong tren trang chi tiet): toc.js
//   danh dau pay/lock, chap.js bao loi tieng Viet ro rang — KHONG
//   mo khoa, khong dung co che password cua base (do la duong vong
//   qua khoa tra phi).
// - Base Darkrai9x truyenhd v15 (src doc duoc, du vong doi) dung hop
//   dong cu (let, return null, .first() truthy, tag nsfw) — viet lai
//   theo hop dong hien tai + quy tac nha; them search.js (base thieu)
//   va gen.js dung chung cho danh sach SSR + the loai qua API.
// - Site co noi dung 18+ (the loai Sac / Truyen 18+ trong base,
//   truyen NP tren trang chu) — metadata nsfw: true theo tien le
//   NiACG / MongTruyen / alicesw.
// - Luu y ve file lib: file nay duoc cac script khac tai len, nen
//   KHONG duoc tai them file nao khac o day. Script nao dung helper
//   thi tai truoc theo thu tu: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://truyenhdc.com";

// API danh sach the loai (host lay tu h1[data-api] trang the loai;
// chi tiet #views cung co data-api="s1apihd.com").
var API_HOST = "https://s1apihd.com";

// Domain co the doi trong cai dat nguon (truyenhdc.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror dung duoc (kiem chung 2026-11-14): truyenhd.com chi
// la lander, truyenvkl.com 403, truyenhdt.com khong phan hoi.
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

// Bo dau tieng Viet de so sanh ten the loai / tu khoa.
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

// 34 the loai cua site (kiem chung live 2026-11-14: hop nav trang chu
// + bo loc trang the loai; base v15 co 37 muc, mot so da doi ten hoac
// khong con tren site hien tai).
var GENRES = [
    { slug: "am-thuc", title: "Ẩm Thực" },
    { slug: "bach-hop", title: "Bách Hợp" },
    { slug: "can-dai", title: "Cận Đại" },
    { slug: "co-dai", title: "Cổ Đại" },
    { slug: "dam-my", title: "Đam Mỹ" },
    { slug: "di-gioi", title: "Dị Giới" },
    { slug: "di-nang", title: "Dị Năng" },
    { slug: "dien-van", title: "Điền Văn" },
    { slug: "do-thi", title: "Đô Thị" },
    { slug: "hai-huoc", title: "Hài Hước" },
    { slug: "he-thong", title: "Hệ Thống" },
    { slug: "huyen-huyen", title: "Huyền Huyễn" },
    { slug: "khoa-huyen", title: "Khoa Huyễn" },
    { slug: "lam-giau", title: "Làm Giàu" },
    { slug: "lam-ruong", title: "Làm Ruộng" },
    { slug: "linh-di", title: "Linh Dị" },
    { slug: "mat-the", title: "Mạt Thế" },
    { slug: "ngon-tinh", title: "Ngôn Tình" },
    { slug: "nguoc", title: "Ngược" },
    { slug: "nu-cuong", title: "Nữ Cường" },
    { slug: "nu-phu", title: "Nữ Phụ" },
    { slug: "showbiz", title: "Showbiz" },
    { slug: "sung", title: "Sủng" },
    { slug: "thanh-xuan", title: "Thanh Xuân" },
    { slug: "thi-giac-nu-chu", title: "Thị Giác Nữ Chủ" },
    { slug: "tien-hiep", title: "Tiên Hiệp" },
    { slug: "trinh-tham", title: "Trinh Thám" },
    { slug: "trong-sinh", title: "Trọng Sinh" },
    { slug: "tuong-lai", title: "Tương Lai" },
    { slug: "va-mat", title: "Vả Mặt" },
    { slug: "vuon-truong", title: "Vườn Trường" },
    { slug: "xuyen-khong", title: "Xuyên Không" },
    { slug: "xuyen-nhanh", title: "Xuyên Nhanh" },
    { slug: "xuyen-sach", title: "Xuyên Sách" }
];

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
// Tra {doc} hoac {error} cho HTML, {json} hoac {error} cho JSON. Khong
// retry 403; 429/405 thi ghi cooldown, khong dung browser fallback
// (cung IP, vo ich — quy tac 11).
// options: {method, headers, body} (cho POST admin-ajax).
function thdFetchDoc(url, referer, options) {
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
        return { error: rateLimitErrorMessage("TruyệnHD", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("TruyệnHD", pacedHostOf(url), r.cooldownRemainingMs) };
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

function thdFetchJson(url, referer, options) {
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
        return { error: rateLimitErrorMessage("TruyệnHD", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("TruyệnHD", pacedHostOf(url), r.cooldownRemainingMs) };
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
    var data = null;
    try {
        data = JSON.parse(text);
    } catch (e3) {
        return { error: "Không đọc được dữ liệu JSON: " + url };
    }
    return { json: data };
}
