// config.js — Cau hinh va danh muc cho Me Truyen Chu VN
//
// BASE_URL mac dinh la domain chinh (.com.vn). Mirror metruyenchuvn.com /
// .org da kiem chung bang curl 2026-11-08: ca hai deu tra HTTP 200 nhung
// CHI redirect (301/302) ve metruyenchu.com.vn — chung khong phuc vu noi
// dung truc tiep. Dua vao MIRROR_LIST van co ich khi domain chinh bi chan
// o muc DNS/tuyen duong nhung mirror van mo duoc (redirect se dan ve
// domain chinh); neu domain chinh chet han thi mirror cung khong cuu
// duoc. wikidichvn.com bi Cloudflare chan tu VM (HTTP 403, kiem chung
// 2026-11-08) nen KHONG dua vao MIRROR_LIST — chi giu trong DOMAIN.values
// de Anh tu chon tren may that (o do cookie cf_clearance cua trinh duyet
// da qua xac minh co the mo duoc); can kiem chung tren dien thoai truoc
// khi dua no vao failover tu dong.
//
// fetchWithMirrors() KHONG gan lai BASE_URL nhu ban sangtacviet: o day
// khong co co che grant/key gan voi origin (chap chi la GET HTML don
// gian), va mirror chi redirect ve domain chinh nen giu BASE_URL on dinh
// se tranh request nao cung phai redirect them mot vong.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
var BASE_URL = "https://metruyenchu.com.vn";

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
var MIRROR_LIST = ["https://metruyenchuvn.com", "https://metruyenchuvn.org"];

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
// BASE_URL (fetchWithMirrors se tu failover neu BASE_URL chet).
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

// Fetch co failover qua mirror: thu URL goc truoc, neu fetch loi hoac HTTP
// khong ok thi thu lai tren tung mirror (chi thay origin, giu nguyen path
// + query). Tra ve response dau tien co ok === true; neu tat ca deu hong
// thi tra ve response cuoi cung khac null (de caller bao dung ma HTTP),
// hoac null neu tat ca deu nem exception. Chi failover khi URL thuoc mot
// origin da biet cua site (BASE_URL hoac mirror).
function fetchWithMirrors(url, options) {
    var originMatch = String(url).match(/^https?:\/\/[^\/]+/);
    var origin = originMatch ? originMatch[0] : "";
    var known = (origin === BASE_URL);
    var m = 0;
    if (!known) {
        for (m = 0; m < MIRROR_LIST.length; m++) {
            if (origin === MIRROR_LIST[m]) { known = true; break; }
        }
    }
    var bases = [BASE_URL];
    if (known) {
        for (m = 0; m < MIRROR_LIST.length; m++) {
            bases.push(MIRROR_LIST[m]);
        }
    }
    var lastRes = null;
    for (var i = 0; i < bases.length; i++) {
        var tryUrl = url;
        if (i > 0) {
            tryUrl = String(url).replace(/^https?:\/\/[^\/]+/, bases[i]);
        }
        var res = null;
        try {
            res = fetch(tryUrl, options || {});
        } catch (e) {
            res = null;
        }
        if (res && res.ok) return res;
        if (res) lastRes = res;
    }
    return lastRes;
}

// Tim token trang sau trong khoi phan trang ".phan-trang a.btn-page".
// Uu tien: (1) link co page = trang hien tai + 1; (2) link "tiep" (ky tu
// ❭ / » / › hoac chu "Tiep"/"Sau") co page lon hon trang hien tai. Tra ve
// "" (string rong) khi het trang — KHONG BAO GIO tra null.
function findNextPage(doc, currentPage) {
    var links = doc.select(".phan-trang a.btn-page");
    if (links.size() === 0) return "";
    var i = 0;
    var j = 0;
    for (i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/page=(\d+)/);
        if (m && parseInt(m[1], 10) === currentPage + 1) return String(currentPage + 1);
    }
    for (j = 0; j < links.size(); j++) {
        var t = links.get(j).text().trim();
        var isNextLabel = (t === "❭" || t === "»" || t === "›" || t.toLowerCase().indexOf("tiếp") !== -1 || t.toLowerCase().indexOf("sau") !== -1);
        if (isNextLabel) {
            var h2 = links.get(j).attr("href") || "";
            var m2 = h2.match(/page=(\d+)/);
            if (m2 && parseInt(m2[1], 10) > currentPage) return String(currentPage + 1);
        }
    }
    return "";
}

// Danh sach the loai cua site. Da kiem chung bang curl 2026-11-08:
// "Canh Ky" (/the-loai/canh-ky), "Huyen Nghi" (/the-loai/huyen-nghi) va
// "Ky Ao" (/the-loai/ky-ao) tra HTTP 200 nhung 0 truyen, khong co trong
// menu the loai cua trang chu (38 slug) — site that su khong co 3 the
// loai nay nen da bo khoi danh sach (v1 co ca 3). "Dong Nhan" va "Da Su"
// tuy khong co trong menu trang chu nhung van tra 20 truyen/trang nen
// giu lai.
var GENRES = [
    { title: "Tiên Hiệp", slug: "/the-loai/tien-hiep" },
    { title: "Huyền Huyễn", slug: "/the-loai/huyen-huyen" },
    { title: "Đô Thị", slug: "/the-loai/do-thi" },
    { title: "Khoa Huyễn", slug: "/the-loai/khoa-huyen" },
    { title: "Võng Du", slug: "/the-loai/vong-du" },
    { title: "Đồng Nhân", slug: "/the-loai/dong-nhan" },
    { title: "Dã Sử", slug: "/the-loai/da-su" },
    { title: "Kiếm Hiệp", slug: "/the-loai/kiem-hiep" }
];
