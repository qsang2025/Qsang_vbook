// config.js — Cau hinh cho extension ReaderNovel (readernovel.net).
//
// Site EN (SSR), light novel tieng Anh doc mien phi, khong login,
// khong khoa VIP/preview (kiem chung tu VM 2026-11-15):
// - Trang chu 200, 190.102 B; www.readernovel.net la domain chinh.
// - Danh sach: /browse?sort=<name|popular|date>&status=<0|1|2>&p=<N>
//   — 30 truyen/trang, item div.manga-block.mt-2.mb-3 > a (title attr,
//   img data-src lozad, strong.name) + div trang thai; phan trang
//   /browse?p=N (token = so trang ke tiep).
// - The loai: checkbox input[name=genre[]] trong form #collapseFilter,
//   ten trong span.checkbox-text; 107 the loai, id so (vd. Action=3,
//   Fantasy=1); loc the loai: /browse?sort=name&status=0&genre[]=<id>.
// - Tim kiem: POST /search, JSON {"query","_token"} (token lay tu
//   data-csrf cua input.input-search tren trang chu), tra JSON
//   {result:[{slug,name,image}]} — POST treo tu VM (000), chi kiem
//   chung duoc tren may that.
// - Chi tiet: /novel/<slug>-<id>/ — h1.page-title, tac gia
//   a[href^=/author/], bia meta og:image (/imgs/medium/...), the loai
//   link /browse?...genre[]=N, trang thai "Status : Ongoing/Completed",
//   mo ta #collapseSummary, muc luc day du #chapters-list a (734 chuong
//   o truyen mau, khong page.js).
// - Chuong: /read/<slug>/<id>-chapter-<n> — tieu de span.chapter-title,
//   noi dung div#chapter-container.chapter-content p (ch.1: 40 doan,
//   mo dau "Apparently I Grew Wings" / "Hmmm…"; ch.2: 30 doan).
//   Doan dau tien lap lai tieu de chuong; cuoi chuong co 1 doan ghi
//   chu dich "This translation was made by our team..." — ca hai deu
//   duoc loc o chap.js. Chuong rong (vd. ch.604.2 chi co doan ghi chu)
//   tra loi tieng Viet, khong gia vo co noi dung.
// - The loai 18+ (Adult, Adult romance, Ecchi, Erotic, Lolicon,
//   Mature, Mature romance, Smut, Steamy stories) co tren site —
//   genre.js loc khoi danh sach, manifest gan co nsfw: true.
// - Dung UA mac dinh cua runtime (quy tac 10 AGENTS.md), khong set UA rieng.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://www.readernovel.net";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: khong co — chi co www.readernovel.net.
var MIRROR_LIST = [];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = String(MIRRORS).split(",");
        var cleaned = [];
        for (var mi = 0; mi < injected.length; mi++) {
            var mu = injected[mi].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (mu && mu !== BASE_URL) cleaned.push(mu);
        }
        if (cleaned.length > 0) MIRROR_LIST = cleaned;
    }
} catch (e2) {
}

function normalizeUrl(raw) {
    var u = String(raw || "").trim();
    if (!u) return "";
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.indexOf("http") !== 0) {
        if (u.charAt(0) !== "/") u = "/" + u;
        return BASE_URL + u;
    }
    // Cung site, khac host (www / khong www / http): doi ve BASE_URL.
    var m = u.match(/^https?:\/\/(?:www\.)?readernovel\.net(\/.*)?$/i);
    if (m) return BASE_URL + (m[1] || "/");
    return u;
}

function absUrl(href) {
    if (!href) return "";
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
    if (!r.ok) return { error: rateLimitErr("ReaderNovel", url, r) };
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}

// --- URL phan trang danh sach ----------------------------------------------
// Trang 1 tra ve duong dan goc; trang N>1 them ?p=N (hoac &p=N neu duong
// dan da co query, nhu /browse?sort=date&status=0).
function pageUrl(path, pageNum) {
    if (!pageNum || pageNum <= 1) return path;
    if (path.indexOf("?") !== -1) return path + "&p=" + pageNum;
    return path + "?p=" + pageNum;
}

// --- Tim so trang ke tiep --------------------------------------------------
// Quet cac link phan trang ?p=N tren trang danh sach, lay max; tra ve
// so trang ke tiep dang chuoi, "" khi het trang.
function nextPageToken(doc, pageNum) {
    var maxPage = 0;
    var links = doc.select("a[href*='p=']");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/[?&]p=(\d+)/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    }
    if (maxPage > pageNum) return String(pageNum + 1);
    return "";
}

// --- Parse danh sach truyen chung (trang list) ------------------------------
// Moi item: div.manga-block.mt-2.mb-3 > a (title attr, img data-src,
// strong.name) + div trang thai ke sau. 30 truyen/trang.
function parseNovelItems(doc) {
    var items = [];
    var rows = doc.select("div.manga-block.mt-2.mb-3");
    for (var i = 0; i < rows.size(); i++) {
        var el = rows.get(i);
        var a = selFirst(el, "a[href^=/novel/]");
        if (!a) continue;
        var link = absUrl(a.attr("href"));
        var name = cleanText(a.attr("title")) || cleanText(a.select("strong.name").text());
        if (!link || !name) continue;
        var cover = "";
        var img = selFirst(el, "img");
        if (img) {
            cover = img.attr("data-src") || img.attr("src") || "";
            if (cover) cover = absUrl(cover);
        }
        var status = cleanText(el.select("div.text-text-light").text());
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: status,
            host: BASE_URL
        });
    }
    return items;
}
