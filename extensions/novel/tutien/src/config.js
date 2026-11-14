// config.js — Cau hinh goc cua TruyenCv (tutien.pro).
//
// Site la SPA Vue 3 + Vite: trang chu chi la shell 3,9 KB, moi du lieu
// qua API JSON rieng, base https://tutien.pro, KHONG can dang nhap
// (da xac minh an danh tu VM 2026-11-14).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch.
//
// PACING (AGENTS.md muc 6.11): 1 request/lan/host, goi pacedFetch() o duoi
// (file rate-limit.js, phai duoc nap truoc khi goi) — pacedFetch tu nghi
// jitter 500-1500ms truoc request dau tien, retry 429/405/503 toi da 3 lan.
// Khong request song song tren cung host. Khong xoay User-Agent (muc 6.10):
// dung UA mac dinh cua runtime.
//
// MO HINH KHOA CUA SITE (khao sat 2026-11-14): chuong co the bi khoa
// early-access co thoi han (lock_price + lock_until trong tuong lai,
// mo bang ve/gold tren web, ban xem truoc 200 ky tu). Extension KHONG
// mo khoa, KHONG hien thi ban xem truoc cua chuong khoa nhu noi dung
// that. Quet 2 sach lon (1.752 + 3.084 chuong): 0 chuong khoa — nhanh
// khoa chua duoc kiem chung live.
//
// File nay duoc nap boi cac script khac, nen KHONG duoc nap them file
// nao khac o day. Script nao can helper thi tu nap file lib do o dau
// file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://tutien.pro";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var MIRROR_LIST = ["https://www.tutien.pro"];

var SITE_HOST = "tutien.pro";
var SITE_NAME = "TruyenCv";

// 16 the loai nhom the_loai lay tu API /story/genres/ ngay 2026-11-14
// (tong 459 the loai; nhom the_loai la the loai chinh cua site, frontend
// tu chon find(g => g.group === "the_loai")). Dung lam fallback cho
// genre.js khi API the loai loi, va de doi ten the loai thanh slug
// trong detail.js.
var GENRES = [
    ["huyen-huyen", "Huyền Huyễn"],
    ["khoa-huyen", "Khoa Huyễn"],
    ["vong-du", "Võng Du"],
    ["huyen-nghi", "Huyền Nghi"],
    ["canh-ky", "Cạnh Kỹ"],
    ["vo-hiep", "Võ Hiệp"],
    ["kiem-hiep", "Kiếm Hiệp"],
    ["linh-di", "Linh Dị"],
    ["light-novel", "Light Novel"],
    ["lich-su", "Lịch Sử"],
    ["da-su", "Dã Sử"],
    ["tien-hiep", "Tiên Hiệp"],
    ["ngon-tinh", "Ngôn Tình"],
    ["dong-nhan", "Đồng Nhân"],
    ["ky-huyen", "Kỳ Huyễn"],
    ["do-thi", "Đô Thị"]
];

function genreSlugByName(name) {
    var n = (name || "").trim();
    if (!n) return "";
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        if (GENRES[i][1] === n) return GENRES[i][0];
    }
    return "";
}

var SLUG_RE = /\/truyen\/([^\/?#]+)/;
var CHAP_RE = /\/truyen\/([^\/?#]+)\/chapter-(\d+)/;

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

function extractChap(url) {
    var m = CHAP_RE.exec(url || "");
    if (!m) return null;
    return { slug: m[1], number: m[2] };
}

// Headers dung chung cho fetch API JSON: Accept JSON + Referer, KHONG
// gan User-Agent (dung UA mac dinh cua runtime — AGENTS.md muc 6.10).
function defaultHeaders(referer) {
    var h = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
    };
    h["Referer"] = referer || (BASE_URL + "/");
    return h;
}

// Fetch co pacing qua pacedFetch (file rate-limit.js). Tra ve object
// {ok, status, res, error, cooldownRemainingMs} — body doc 1 lan boi
// caller (res.text() / res.html() / res.json()).
// options: {method, body, headers, referer}.
function fetchTT(url, options) {
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

// GET JSON tu API cua site. Tra ve object JSON hoac null khi loi.
function fetchJson(url) {
    var r = fetchTT(url, { headers: defaultHeaders() });
    if (!r.ok || !r.res) return null;
    try {
        return r.res.json();
    } catch (e) {
        return null;
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
// bai). Tra ve Document hoac null.
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

// Anh bia cua truyen: cover_image trong API da la URL tuyet doi tren
// media cua site; tra ve nguyen ven, "" neu thieu.
function storyCover(item) {
    var c = (item && item.cover_image) || "";
    if (!c) return "";
    if (c.indexOf("//") === 0) return "https:" + c;
    return c;
}

// Map 1 story tu API thanh item cua vBook (list/search/detail suggests).
function storyToItem(st) {
    var slug = (st && st.slug) || "";
    if (!slug) return null;
    var title = (st.title || "").trim();
    if (!title) return null;
    var author = "";
    if (st.author && st.author.name) author = st.author.name;
    var total = st.total_chapters;
    var descParts = [];
    if (author) descParts.push("Tác giả: " + author);
    if (total !== undefined && total !== null) descParts.push("Số chương: " + total);
    var tag = "";
    if (st.is_completed) tag = "Hoàn thành";
    else if (st.status === "completed") tag = "Hoàn thành";
    else if (st.status) tag = st.status;
    return {
        name: title,
        link: "/truyen/" + slug,
        host: BASE_URL,
        cover: storyCover(st),
        description: descParts.join(" • "),
        tag: tag
    };
}

// Token trang ke cua API phan trang {next}: con trang ke thi tra so
// trang ke (chuoi), het thi "".
function nextFromApi(data, p) {
    if (data && data.next) return String(p + 1);
    return "";
}
