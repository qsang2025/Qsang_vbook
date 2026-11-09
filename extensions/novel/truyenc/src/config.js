// config.js — Cau hinh va helper dung chung cho TruyenC
//
// BASE_URL mac dinh la domain chinh (truyenc.net). Mirror www.truyenc.net
// da kiem chung bang curl 2026-11-08: tra HTTP 200, phuc vu dung noi dung
// (khong redirect), nen dua vao MIRROR_LIST de fetchDocWithFallback()
// tu failover khi domain chinh chet. Khong co mirror that nao khac.
//
// API_BASE la backend API chinh thuc cua chinh site (frontend cua site
// dung no: getStories/getChapters trong chunk _next/static; da kiem chung
// bang curl 2026-11-08): chi dung lam DUONG DU PHONG cho search khi
// tim-kiem HTML tra 0 ket qua, va lam nguon chinh cho toc.js (danh sach
// chuong day du co tieu de that). Khong dung lam duong chinh cho
// search/detail/chap (HTML SSR cua site van chay tot, giu nguyen).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
var BASE_URL = "https://truyenc.net";

// Backend API chinh thuc cua site (CloudFront, frontend site dung truc tiep).
var API_BASE = "https://d1h3pbiwmrpito.cloudfront.net";

// Tach chuoi mirror cach nhau bang dau phay (hoac mang co san) thanh mang
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

// Danh sach mirror mac dinh (khop voi config MIRRORS trong plugin.json).
var MIRROR_LIST = ["https://www.truyenc.net"];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

// BASE_URL khong bao gio nam trong danh sach mirror (tranh thu lap chinh no).
(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    } else if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Chuan hoa moi URL cua site ve BASE_URL (gom 1 cho thay vi regex rewrite
// host lap lai o detail.js / toc.js / chap.js). URL tuong doi thi gan
// BASE_URL; URL tuyet doi tren domain/mirror cua site thi doi origin ve
// BASE_URL (fetchDocWithFallback se tu failover neu BASE_URL chet).
function normalizeUrl(url) {
    if (!url) return "";
    url = String(url);
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== "/") url = "/" + url;
        return BASE_URL + url;
    }
    var m = url.match(/^https?:\/\/[^\/]+/);
    if (m) return BASE_URL + url.substring(m[0].length);
    return url;
}

// Doc danh sach truyen tu trang ket qua (search.js / gen.js dung chung).
// Card cua site CHINH LA the <a href="/truyen/...">: anh bia, ten (h2),
// mo ta (p) deu nam TRONG the <a> — khong can leo len .parent() (API
// khong ton tai trong runtime vBook, toan bo logic leo card cu la dead
// code). Chi lay du lieu tu ben trong the <a> da chon.
// Loai: link chuong (/chuong-), link trung lap, muc khong co ten that.
function parseNovelCards(doc) {
    var list = [];
    var seen = {};
    var links = doc.select("a[href*='/truyen/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        // Chi loai link CHUONG (/truyen/<slug>/chuong-123). Khong dung
        // substring "/chuong-" (ban cu): ten truyen co slug bat dau bang
        // "chuong-" (vi du /truyen/chuong-mon-su-thuc-...) se bi loai
        // nham — bat duoc tren may that 2026-11-08 (gen tra 49/50 muc).
        if (!href || /\/chuong-\d+/.test(href)) continue;
        var fullLink = normalizeUrl(href);
        var cleanLink = fullLink.replace(/\/+$/, "");
        if (seen[cleanLink]) continue;

        var name = "";
        var hEl = a.select("h1, h2, h3").first();
        if (hEl) name = hEl.text().trim();
        if (!name) name = a.attr("title") || "";
        if (!name) name = a.text().trim();
        if (!name || name.length < 2) continue;
        if (name === "Đọc ngay" || name === "Xem thêm" || name === "Full") continue;

        var cover = "";
        var imgEl = a.select("img").first();
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
        }

        var desc = "";
        var descEl = a.select("p").first();
        if (descEl) desc = descEl.text().trim();

        seen[cleanLink] = true;
        list.push({
            name: name,
            link: fullLink,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    }
    return list;
}

// Tim token trang sau: quet moi link co "page=" va KHOP CHINH XAC so trang
// (regex co ranh gioi [?&]page=N($|[&#])) — ban cu dung substring
// "page=" + N nen page=2 khop nham page=20/page=30... Tra ve "" (string
// rong) khi het trang — KHONG BAO GIO tra null.
function findNextPage(doc, currentPage) {
    var links = doc.select("a[href*='page=']");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/[?&]page=(\d+)(?:[&#]|$)/);
        if (m && parseInt(m[1], 10) === currentPage + 1) return String(currentPage + 1);
    }
    return "";
}

// Bang the loai tinh — CHI dung o du phong detail.js (map ten the loai
// trong JSON-LD "genre" sang slug /the-loai/...). Duong chinh lay link
// pill that tren trang chi tiet, khong dung bang nay.
// Kiem tra 2026-11-09: site /the-loai co 55 the loai, bang nay chi co
// 16 the loai pho bien — ten nao khong co trong bang (vd. "Co Dai")
// se bi roi o nhanh du phong (khong che slug). Kiem tra dinh ky bang
// nay voi /the-loai; neu site doi ten/slug the loai thi cap nhat o day.
var GENRES = [
    { title: "Tiên Hiệp", slug: "/the-loai/tien-hiep" },
    { title: "Kiếm Hiệp", slug: "/the-loai/kiem-hiep" },
    { title: "Huyền Huyễn", slug: "/the-loai/huyen-huyen" },
    { title: "Đô Thị", slug: "/the-loai/do-thi" },
    { title: "Võng Du", slug: "/the-loai/vong-du" },
    { title: "Hệ Thống", slug: "/the-loai/he-thong" },
    { title: "Xuyên Không", slug: "/the-loai/xuyen-khong" },
    { title: "Trọng Sinh", slug: "/the-loai/trong-sinh" },
    { title: "Khoa Huyễn", slug: "/the-loai/khoa-huyen" },
    { title: "Dị Giới", slug: "/the-loai/di-gioi" },
    { title: "Đồng Nhân", slug: "/the-loai/dong-nhan" },
    { title: "Dã Sử", slug: "/the-loai/da-su" },
    { title: "Ngôn Tình", slug: "/the-loai/ngon-tinh" },
    { title: "Đam Mỹ", slug: "/the-loai/dam-my" },
    { title: "Linh Dị", slug: "/the-loai/linh-di" },
    { title: "Mạt Thế", slug: "/the-loai/mat-the" }
];
