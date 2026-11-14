// config.js — cau hinh goc cua extension iSach (isach.info).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// Site: isach.info — thu vien sach tieng Viet, doc online mien phi, khong
// can dang nhap. Du lieu lay qua scrape HTML (khong co API cong khai):
// danh sach /story.php?list=story, tim kiem /search/story_result.php,
// bang xep hang /most_reading.php, chi tiet /story.php?story=..., muc luc
// &chapter=0000, chuong &chapter=NNNN. Ban tai ePub/mobi/PDF tren web can
// dang nhap + ton "gao" va link co href rong (JS alert) nen khong dua vao
// extension — chi lam doc online (xem ISACH-PROGRESS.md §1).
//
// LUU Y: file nay duoc tai len boi cac script khac, nen KHONG duoc tai
// them file nao khac o day. Script nao can pacing thi tu tai file
// rate-limit.js o dau file cua chinh no; script nao can lay phan tu
// dau tien an toan thi tai file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://isach.info";

try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Danh sach mirror mac dinh (khop voi config MIRRORS trong plugin.json).
var MIRROR_LIST = [];

try {
    if (MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

// Tach chuoi mirror cach nhau bang dau phau (hoac mang co san) thanh mang
// cac base URL sach (bo khoang trang va dau "/" cuoi).
function parseMirrorList(value) {
    var list = [];
    var parts = [];
    var i = 0;
    if (typeof value === "string") {
        parts = value.split(",");
        for (i = 0; i < parts.length; i++) {
            var u = parts[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (u) list.push(u);
        }
        return list;
    }
    if (value instanceof Array) {
        for (i = 0; i < value.length; i++) {
            var v = String(value[i]).replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (v) list.push(v);
        }
        return list;
    }
    return list;
}

// Site phan biet User-Agent (kiem chung live 2026-11-14): UA mac dinh
// cua runtime (mobile) bi tra ve template mobile ("# mobile" trong
// title, CSS motsach.mobi.css) — khong co #motsach_content_body, khong
// co div.ms_text o trang chi tiet, va endpoint tim kiem tra 404. Chi UA
// desktop moi nhan duoc template day du (kiem chung tu VM + probe tren
// may that). Vi vay fetchPage LUON gui UA desktop Chrome co dinh cho moi
// request cua extension nay (ngoai le co bang chung theo quy tac nha
// 6.10 — tien le Tadu). Site khong co Cloudflare nen khong vuong
// chuyen cookie cf_clearance gan voi UA.
var DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// fetchPage(): fetch HTML co pacing + UA desktop co dinh. Ham nay tu goi
// rateLimitDelay nen script dung fetchPage KHONG goi rateLimitDelay
// rieng nua. options duoc chuyen thang cho fetch (vd. queries).
function fetchPage(url, options) {
    if (!options) options = {};
    try {
        if (typeof rateLimitDelay === "function") {
            rateLimitDelay("isach.info");
        }
    } catch (e) {
    }
    var headers = {
        "User-Agent": DESKTOP_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9",
        "Referer": BASE_URL + "/"
    };
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }
    options.headers = headers;
    return fetch(url, options);
}

// Ghep href tuong doi ("/story.php?..." hoac "story.php?...") thanh URL
// tuyet doi theo BASE_URL hien tai.
function absUrl(href) {
    href = String(href || "");
    if (!href) return "";
    if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

// Lay slug truyen tu link dang story.php?story=<slug> (bo phan & sau do).
function storySlug(link) {
    var m = String(link || "").match(/story=([^&#]+)/);
    return m ? m[1] : "";
}

// URL anh bia theo mau cua site: /images/story/cover/<slug>.jpg
// (da kiem chung HTTP 200 cho sach mau; sach khong co bia thi 404).
function coverUrl(slug) {
    if (!slug) return "";
    return BASE_URL + "/images/story/cover/" + slug + ".jpg";
}
