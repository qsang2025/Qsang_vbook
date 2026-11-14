// config.js — Cau hinh cho extension NovelPhoenix (novelphoenix.net).
//
// Site EN (SSR), web novel & light novel tieng Anh doc mien phi, khong
// login, khong khoa VIP/preview (kiem chung tu VM 2026-11-15):
// - Trang chu 200, 120.751 B, giong nhau voi UA desktop va mobile.
// - www.novelphoenix.net 301 ve https://novelphoenix.net/ (khong mirror).
// - Danh sach: /latest-release-novel, /new-novel, /hot-novel,
//   /most-popular, /completed-novel, /genre/<Ten> — 22 truyen/trang,
//   phan trang ?page=N; item div.li > .con > .pic img + .txt h3.tit a.
// - Tim kiem: GET /search?keyword=<tu khoa> (&page=N).
// - Chi tiet: /<slug>.html (co ca dang <slug>-novel.html) — h1.tit trong
//   .m-desc, tac gia a[href^=/author/], bia meta og:image, the loai
//   .txt .item a[href^=/genre/], trang thai link title Ongoing/Completed,
//   mo ta #novel-summary-inner, so chuong + so trang muc luc o
//   #list-chapter (data-total-chapters, data-total-page, data-base-url).
// - Muc luc: #list-chapter #idData li a.con — 40 chuong/trang, phan trang
//   bang ?page=N tren URL chi tiet (NSHBA: 7.313 chuong / 183 trang).
// - Chuong: /<slug>/chapter-<n>[-<ten-chuong>].html — tieu de h1,
//   noi dung #chapter-content p (ch.1 NSHBA: 70 doan, day du, sach,
//   khong quang cao, khong khoa; ch.7313: 36 doan, day du).
// - The loai 18+ (Mature, Ecchi, Adult, Smut, Hentai) co tren site —
//   genre.js loc khoi danh sach, manifest gan co nsfw: true.
// - Dung UA mac dinh cua runtime (quy tac 10 AGENTS.md), khong set UA rieng.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://novelphoenix.net";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: khong co — www 301 ve bare domain.
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
    var m = u.match(/^https?:\/\/(?:www\.)?novelphoenix\.net(\/.*)?$/i);
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
    if (!r.ok) return { error: rateLimitErr("NovelPhoenix", url, r) };
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
// Trang 1 tra ve duong dan goc; trang N>1 them ?page=N (hoac &page=N neu
// duong dan da co query, nhu /search?keyword=...).
function pageUrl(path, pageNum) {
    if (!pageNum || pageNum <= 1) return path;
    if (path.indexOf("?") !== -1) return path + "&page=" + pageNum;
    return path + "?page=" + pageNum;
}

// --- Tim so trang ke tiep --------------------------------------------------
// Quet cac link phan trang ?page=N tren trang danh sach, lay max; tra ve
// so trang ke tiep dang chuoi, "" khi het trang.
function nextPageToken(doc, pageNum) {
    var maxPage = 0;
    var links = doc.select("a[href*='page=']");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/[?&]page=(\d+)/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    }
    if (maxPage > pageNum) return String(pageNum + 1);
    return "";
}

// --- Parse danh sach truyen chung (trang list + ket qua tim kiem) ----------
// Moi item: div.li > .con > .pic img (bia) + .txt h3.tit a (ten + link);
// .core span (diem), .item-chap-inline .s1 ("181 Chapters"),
// .desc .item a[href^=/genre/] (the loai). 22 truyen/trang.
function parseNovelItems(doc) {
    var items = [];
    var rows = doc.select("div.li");
    for (var i = 0; i < rows.size(); i++) {
        var el = rows.get(i);
        var a = selFirst(el, ".txt h3.tit a");
        if (!a) continue;
        var link = absUrl(a.attr("href"));
        var name = cleanText(a.text()) || cleanText(a.attr("title"));
        if (!link || !name) continue;
        var cover = "";
        var img = selFirst(el, ".pic img");
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
            if (cover) cover = absUrl(cover);
        }
        var descParts = [];
        var rating = cleanText(el.select(".core span").text());
        if (rating) descParts.push(rating + "/5");
        var chapEl = selFirst(el, ".item-chap-inline .s1");
        if (chapEl) {
            var ch = cleanText(chapEl.text());
            if (ch) descParts.push(ch);
        }
        var gs = [];
        var glinks = el.select(".desc .item a[href^=/genre/]");
        for (var j = 0; j < glinks.size(); j++) {
            var gt = cleanText(glinks.get(j).text());
            if (gt) gs.push(gt);
        }
        if (gs.length > 0) descParts.push(gs.join(", "));
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: descParts.join(" · "),
            host: BASE_URL
        });
    }
    return items;
}
