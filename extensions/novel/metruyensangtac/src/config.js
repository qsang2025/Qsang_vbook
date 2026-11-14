// config.js — Cau hinh goc cua Me Truyen Sang Tac (metruyensangtac.vn).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch.
//
// PACING (AGENTS.md muc 6.11): 1 request/lan/host, goi pacedFetch() o duoi
// (lib rate-limit.js, phai duoc load truoc khi goi) — pacedFetch tu nghi
// jitter 500-1500ms truoc request dau tien, retry 429/405/503 toi da 3 lan.
// Khong request song song tren cung host. Khong xoay User-Agent (muc 6.10):
// dung UA mac dinh cua runtime.
//
// MO HINH VIP CUA SITE (khao sat 2026-11-14): moi truyen co N chuong dau
// DOC MIEN PHI DAY DU, cac chuong sau KHOA — mo khoa 500 Gold/chuong tren
// web (xem chap.js). Extension KHONG mo khoa, KHONG hien thi ban xem truoc
// cua chuong khoa nhu noi dung that.
// Danh sach truyen va muc luc chay qua API POST cua site
// (pages/fetch_stories.php, pages/load_chapters.php) — hai endpoint POST
// nay bi treo tu IP datacenter VM (tarpit) nhung chay tren may that;
// khi POST that bai, cac script dung browser fallback (trang web cua site
// tu goi API bang JS cua no).
//
// File nay duoc load boi cac script khac, nen KHONG duoc load them file
// nao khac o day. Script nao can helper thi tu load file lib do o dau
// file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://metruyensangtac.vn";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var MIRROR_LIST = [];

var SITE_HOST = "metruyensangtac.vn";
var SITE_NAME = "Mê Truyện Sáng Tác";

// Danh sach the loai lay tu trang chu (2026-11-14): 130 muc, id thua
// (1-205). Ca 3 muc trang thai (1 Con tiep, 11 Hoan thanh, 59 Tam dung)
// cung la the loai tren chinh site. Dung chung cho genre.js va detail.js
// (detail.js doi ten the loai thanh id qua ham genreIdByName o duoi).
var GENRES = [
    [1, "Còn tiếp"],
    [2, "Light Novel"],
    [3, "Nhẹ Nhàng"],
    [5, "Kỳ Ảo"],
    [6, "Tây Phương Kỳ Huyễn"],
    [7, "Tiên Hiệp"],
    [9, "Thần Thoại Tu Chân"],
    [10, "Xuyên Nhanh"],
    [11, "Hoàn thành"],
    [12, "Huyền Huyễn"],
    [13, "Cơ Trí"],
    [14, "Dị Thế Đại Lục"],
    [15, "Vô Hạn"],
    [16, "Truyện Nam"],
    [17, "Vô Sỉ"],
    [19, "Đô Thị"],
    [21, "Tùy Thân"],
    [23, "Phàm Nhân"],
    [24, "Võng Du"],
    [26, "Toàn Dân"],
    [28, "Hiện Đại Ma Pháp"],
    [29, "Thế Giới Tương Lai"],
    [30, "Xây Dựng Thế Lực"],
    [31, "Nhiệt Huyết"],
    [32, "Sảng Văn"],
    [33, "Dã Sử"],
    [34, "Lịch Sử Quan Trường"],
    [35, "Xuyên Không"],
    [36, "Điện Tử Cạnh Kỹ"],
    [37, "Vô Địch"],
    [39, "Giảo Hoạt"],
    [40, "Mạt Thế Nguy Cơ"],
    [41, "Hệ Thống"],
    [43, "Linh Khí Khôi Phục"],
    [44, "Ngự Thú"],
    [45, "Khoa Huyễn"],
    [46, "Thám Hiểm Sinh Tồn"],
    [48, "Tinh Tế Văn Minh"],
    [49, "Thiên Tài"],
    [50, "Huyền Nghi"],
    [51, "Quỷ Bí Huyền Nghi"],
    [52, "Cao Võ Thế Giới"],
    [54, "Trọng Sinh"],
    [55, "Hiện Đại Tu Chân"],
    [56, "Huyễn Tưởng Tu Tiên"],
    [57, "Phản Phái"],
    [58, "Thiết Huyết"],
    [59, "Tạm dừng"],
    [60, "Giá Không Lịch Sử"],
    [61, "Cạnh Kỹ"],
    [62, "Thể Dục Cạnh Kỹ"],
    [63, "Ngu Nhạc Minh Tinh"],
    [65, "Lãnh Khốc"],
    [66, "Võ Hiệp Huyễn Tưởng"],
    [67, "Chư Thiên Vạn Giới"],
    [68, "Điền Viên"],
    [69, "Vương Triều Tranh Bá"],
    [70, "Hắc Ám Huyễn Tưởng"],
    [75, "Viễn Cổ Hồng Hoang"],
    [76, "Kiếm Hiệp"],
    [78, "Hư Nghĩ Võng Du"],
    [79, "Du Hí Dị Giới"],
    [80, "Tu Chân Văn Minh"],
    [85, "Chữa Lành"],
    [86, "Cổ Đại"],
    [90, "Cung Đấu"],
    [94, "Dân Quốc"],
    [95, "Dị Năng"],
    [97, "Đam Mỹ"],
    [98, "Điền Văn"],
    [100, "Đọc Tâm"],
    [104, "Gia Đấu"],
    [108, "Gương Vỡ Lại Lành"],
    [109, "Hài Hước"],
    [110, "Hành Động"],
    [111, "Hào Môn Thế Gia"],
    [112, "HE"],
    [113, "Hiện Đại"],
    [116, "Học Bá"],
    [117, "Học Đường"],
    [119, "Huyền Huyễn Phương Đông"],
    [121, "Không CP"],
    [122, "Không Gian Phương Tây"],
    [123, "Kinh Dị"],
    [125, "Kỳ Ảo Phương Tây"],
    [127, "Lịch Sử"],
    [128, "Linh Dị"],
    [130, "Mạt Thế"],
    [131, "Nghệ Sĩ Giải Trí"],
    [132, "Ngôn Tình"],
    [133, "Nguyên Sang"],
    [134, "Ngược"],
    [139, "Nữ Cường"],
    [142, "Phép Thuật"],
    [143, "Phiêu Lưu"],
    [146, "Quân Sự"],
    [148, "SE"],
    [151, "Thanh Xuân Vườn Trường"],
    [152, "Thập Niên"],
    [153, "Thật Giả Thiên Kim"],
    [154, "Thượng Cổ Man Hoang"],
    [155, "Thương Trường"],
    [156, "Tiểu Thuyết"],
    [158, "Tổng Tài"],
    [159, "Trả Thù"],
    [160, "Trinh Thám"],
    [161, "Trò Chơi"],
    [163, "Trực Tiếp (Livestream)"],
    [164, "Vả Mặt"],
    [166, "Võ Hiệp Tình Duyên"],
    [167, "Vô Hạn Vũ Trụ"],
    [169, "Xuyên Sách"],
    [172, "Tác Phẩm Nổi Bật"],
    [178, "Tâm Lý"],
    [181, "Tu Tiên"],
    [186, "Khoa Học Viễn Tưởng"],
    [187, "Lãng Mạn"],
    [188, "Truyện Ma"],
    [190, "1v1"],
    [191, "Tình Cảm"],
    [192, "Thiên Chi Kiêu Tử"],
    [194, "Cẩu Huyết"],
    [197, "Tâm Cơ"],
    [198, "Trạch Đấu"],
    [200, "Tâm Linh"],
    [201, "Hậu Cung"],
    [202, "Bách Hợp"],
    [203, "Truyện Nữ"],
    [204, "Kinh Doanh"],
    [205, "Gia Tộc"]
];

function genreIdByName(name) {
    var n = (name || "").trim();
    if (!n) return "";
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        if (GENRES[i][1] === n) return String(GENRES[i][0]);
    }
    return "";
}

var SLUG_RE = /\/truyen\/([^\/?#]+)/;
var ID_TRUYEN_RE = /var\s+DECU_ID_TRUYEN\s*=\s*(\d+)/;

function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function absUrl(url) {
    if (!url) return "";
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("http") === 0) return url;
    if (url.charAt(0) !== "/") url = "/" + url;
    return BASE_URL + url;
}

function resolveUrl(url) {
    if (!url) return BASE_URL + "/";
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.charAt(0) !== "/") url = "/" + url;
    return BASE_URL + url;
}

function extractSlug(url) {
    var m = SLUG_RE.exec(url || "");
    return m ? m[1] : "";
}

// Headers dung chung cho fetch: Accept + Referer, KHONG gan User-Agent
// (dung UA mac dinh cua runtime — AGENTS.md muc 6.10). pacedFetch() se
// goi ham nay neu no ton tai (xem file rate-limit.js).
function defaultHeaders(referer) {
    var h = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
    };
    h["Referer"] = referer || (BASE_URL + "/");
    return h;
}

// Fetch co pacing qua pacedFetch (file rate-limit.js). Tra ve object
// {ok, status, res, error, cooldownRemainingMs} — body doc 1 lan boi
// caller (res.text() / res.html() / res.json()).
// options: {method, body, headers, referer}.
function fetchMTS(url, options) {
    options = options || {};
    var req = { referer: options.referer || (BASE_URL + "/") };
    if (options.method) req.method = options.method;
    if (options.body !== undefined && options.body !== null) req.body = options.body;
    if (options.headers) req.headers = options.headers;
    try {
        return pacedFetch(url, req);
    } catch (e) {
        return { ok: false, status: 0, res: null, error: String(e), cooldownRemainingMs: 0 };
    }
}

// Thong bao loi tieng Viet cho ket qua pacedFetch that bai.
function pacedErrorMessage(r) {
    if (r && r.error === "cooldown") {
        return rateLimitErrorMessage(SITE_NAME, SITE_HOST, r.cooldownRemainingMs || 0);
    }
    if (r && (r.status === 429 || r.status === 405)) {
        return rateLimitErrorMessage(SITE_NAME, SITE_HOST, 0);
    }
    if (r && r.status) return "Không tải được trang từ " + SITE_NAME + " (HTTP " + r.status + ").";
    return "Không tải được trang từ " + SITE_NAME + " (lỗi mạng).";
}

// Mo trang bang trinh duyet headless cua app (fallback khi fetch that
// bai — vd. API POST bi chan tu IP). Tra ve Document hoac null.
function openInBrowser(pageUrl, timeoutMs) {
    var browser = Engine.newBrowser();
    try {
        return browser.launch(pageUrl, timeoutMs || 20000);
    } catch (e) {
        return null;
    } finally {
        try { browser.close(); } catch (e2) {}
    }
}
