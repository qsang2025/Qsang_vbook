// config.js — Cau hinh cho extension FanMTL (fanmtl.com).
//
// Site EN (SSR), fan-fiction & web novel mien phi, khong login, khong
// khoa VIP/preview (kiem chung tu VM 2026-11-14):
// - fanmtl.com 301 -> https://www.fanmtl.com/; domain mac dinh la www.
// - Danh sach: /list/<theloai>/<trangthai>-<sapxep>-<trang>.html,
//   30 truyen/trang; item li.novel-item (bia img.lazy data-src,
//   h4.novel-title, .novel-stats: so chuong / cap nhat / status).
// - The loai: ~86 muc o ul.proplist tren trang danh sach.
// - Chi tiet: /novel/<slug>.html — article#novel; bia figure.cover img
//   (data-src), h1.novel-title, h2.alternative-title (ten goc tieng Trung),
//   .author span[itemprop=author], #readchapterbtn -> chuong 1,
//   .header-stats (so chuong + Ongoing/Completed), .categories
//   (a.property-item), #info .summary .content (mo ta).
// - Muc luc: /e/extend/fy.php?page=<N>&wjm=<slug> — ul.chapter-list,
//   100 chuong/trang; link ">>" trong phan trang cho biet trang cuoi.
// - Chuong: /novel/<slug>_<n>.html — #chapter-article .chapter-content,
//   cac doan <p> sach; dau co 1 div quang cao (div[align=center] + script)
//   can cat bo. Tieu de chuong: header.chapter-header h2.
// - Tim kiem: POST /e/search/index.php (show=title, tempid=1, tbname=news,
//   keyboard=<tu khoa>) — Empire CMS; POST treo tu VM (timeout 30s, tarpit
//   theo IP datacenter), can kiem chung tren may that. search.js theo
//   redirect 302 (neu co) ve trang ket qua nhu shubenshu.
// - Dung UA mac dinh cua runtime (quy tac 10 AGENTS.md), khong set UA rieng.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://www.fanmtl.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: fanmtl.com (khong www) 301 ve www.fanmtl.com.
var MIRROR_LIST = ["https://fanmtl.com"];

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
    var m = u.match(/^https?:\/\/(?:www\.)?fanmtl\.com(\/.*)?$/i);
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
    if (!r.ok) return { error: rateLimitErr("FanMTL", url, r) };
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}

// --- Parse danh sach truyen chung (trang list + trang ket qua tim kiem) ----
// Moi item: li.novel-item > a[href][title]; bia img.lazy (data-src,
// fallback src, bo placeholder); h4.novel-title; .novel-stats.
function parseNovelItems(doc) {
    var items = [];
    var rows = doc.select("li.novel-item");
    for (var i = 0; i < rows.size(); i++) {
        var el = rows.get(i);
        var a = selFirst(el, "a[href^=/novel/]");
        if (!a) continue;
        var link = absUrl(a.attr("href"));
        var name = cleanText(a.attr("title")) || cleanText(el.select("h4.novel-title").text());
        if (!link || !name) continue;
        var cover = "";
        var img = selFirst(el, "img.lazy");
        if (img) {
            cover = img.attr("data-src") || img.attr("src") || "";
            if (cover.indexOf("placeholder-158") !== -1) cover = "";
            if (cover) cover = absUrl(cover);
        }
        var stats = [];
        var spans = el.select(".novel-stats");
        for (var j = 0; j < spans.size(); j++) {
            var t = cleanText(spans.get(j).text());
            if (t) stats.push(t);
        }
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: stats.join(" · "),
            host: BASE_URL
        });
    }
    return items;
}
