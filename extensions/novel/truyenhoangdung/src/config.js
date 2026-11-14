// config.js — Cau hinh cho extension Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Site VN truyen chu (SSR, khong Cloudflare), kiem chung tu VM 2026-11-14:
// - Trang chu 200 (211 KB): nav the loai 19 muc /the-loai/<slug>; muc
//   danh sach /danh-muc/<slug> (bang-xep-hang 100 truyen, khong phan
//   trang; cac muc khac 25 truyen/trang, phan trang theo OFFSET:
//   /<slug>/25, /<slug>/50, ... — so cuoi URL la offset, khong phai so
//   trang; /the-loai/tien-hiep/1 tra ve tu muc 2 tro di).
// - Chi tiet /truyen/<slug>.html: ten o #chi_tiet .title (kem span
//   "Dịch"/"Convert" can cat bo), bia #chi_tiet .image-cover img
//   (src tho co dau cach + dau tieng Viet, can ma hoa tung doan duong
//   dan), thong tin o #chi_tiet .list .item (label: Tên gốc / Tác giả /
//   Thể loại / Tình trạng / Độ tuổi / Lượt xem), mo ta o #noidung,
//   goi y o .truyencv-detail-related ("Cùng tác giả").
// - Muc luc DU 1 lan tren trang chi tiet: #chuong .list-chap a, moi
//   nhat len truoc (Co Chan Nhan: 3.813 link, ch.1–3819) — khong can
//   page.js. Ten chuong kem span "(3 năm trước)" can cat bo.
// - Chuong /<slug>/chuong-<N>/ (ca khi mat dau / cuoi van 200): noi
//   dung trong #noidung; co 2 dang — nhieu the <p> (Am Duong ch.1:
//   100 doan, 14.612 ky tu) hoac 1 the <p> ngan cach bang <br><br>
//   (Co Chan Nhan ch.1: 16.941 ky tu, mo dau "Phương Nguyên, ngoan
//   ngoãn giao ra Xuân Thu Thiền..."). NOI DUNG THAT + DU.
// - Tim kiem GET /home/search/<offset>?search=<key>, 50 ket qua/trang,
//   chay ca co dau va khong dau ("âm dương" va "am duong" deu ra
//   Âm Dương Quỷ Đạo).
// - Site co he thong MUA CHUONG VIP (nut "Mua Chương VIP" + form
//   frmmuachuongvip tren trang chi tiet) va muc "Truyện trả phí" —
//   extension KHONG dua tab tra phi vao home.js, khong mo khoa;
//   chuong trong hoac chi co thong bao khoa thi chap.js bao loi tieng
//   Viet ro rang. Cac truyen mau da kiem (Am Duong, Co Chan Nhan) co
//   0 chuong VIP.
// - www.truyenhoangdung.xyz tra 200 (mirror song) — giu trong DOMAIN
//   select.
//
// Base TamChau truyenhoangdung v3 (src doc duoc, du vong doi) dung hop
// dong cu (const, return null, .first() truthy) — viet lai theo hop
// dong hien tai + quy tac nha, them genre.js (base thieu) va gen.js
// dung chung cho moi danh sach (base tach listWithPagination /
// listWithoutPagination).
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://truyenhoangdung.xyz";

// Domain co the doi trong cai dat nguon (truyenhoangdung.xyz mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: www tra 200 (kiem chung 2026-11-14) — giu lam du phong.
var MIRROR_LIST = ["https://www.truyenhoangdung.xyz"];

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

// Ma hoa tung doan duong dan (bia chi tiet co dau cach + dau tieng Viet
// dang tho, vd. /publics/files/anh bia truyen/am duong quy dao.jpg).
// Doan nao da co % thi giu nguyen, tranh ma hoa kep.
function encodePath(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    var parts = u.split("/");
    for (var i = 0; i < parts.length; i++) {
        var seg = parts[i];
        if (seg && seg.indexOf("%") < 0 && /[^A-Za-z0-9\-._~]/.test(seg)) {
            try {
                parts[i] = encodeURIComponent(seg);
            } catch (e) {
            }
        }
    }
    return parts.join("/");
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
    { slug: "co-dai", title: "Cổ Đại" },
    { slug: "di-gioi", title: "Dị giới" },
    { slug: "do-thi", title: "Đô thị" },
    { slug: "hai-huoc", title: "Hài Hước" },
    { slug: "harem", title: "Harem" },
    { slug: "hien-dai", title: "Hiện Đại" },
    { slug: "huyen-aoky-ao", title: "Huyền ảo/Kỳ Ảo" },
    { slug: "kiem-hiep", title: "Kiếm hiệp" },
    { slug: "lich-su", title: "Lịch sử" },
    { slug: "nao-to", title: "Não To" },
    { slug: "ngon-tinh", title: "Ngôn tình" },
    { slug: "nguoc", title: "Ngược" },
    { slug: "quan-su", title: "Quân Sự Xây Dựng" },
    { slug: "quan-truong", title: "Quan trường" },
    { slug: "tien-hiep", title: "Tiên Hiệp" },
    { slug: "tinh-cam", title: "Tình Cảm" },
    { slug: "tu-chan", title: "Tu Chân" },
    { slug: "van-hoc-viet-nam", title: "Truyện Việt Nam" },
    { slug: "xuyen-khong", title: "Xuyên không" }
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
// Tra {doc} hoac {error} cho HTML. Khong retry 403; 429/405 thi ghi
// cooldown, khong dung browser fallback (cung IP, vo ich — quy tac 11).
// options: {method, headers, body} (cho POST tim kiem).
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
        return { error: rateLimitErrorMessage("Truyện Hoàng Dung", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Truyện Hoàng Dung", pacedHostOf(url), r.cooldownRemainingMs) };
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
