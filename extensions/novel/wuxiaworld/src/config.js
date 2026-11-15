// config.js — Cau hinh cho extension WuxiaWorld (wuxiaworld.com).
//
// Site EN, web novel & light novel tieng Anh. Site chinh nay la React SPA
// (shell 16 KB, khong co noi dung trong HTML) — extension doc ban LITE
// (lite.wuxiaworld.com, SSR, kiem chung tu VM 2026-11-15):
// - Trang chu lite 200, 72.694 B, danh sach truyen that.
// - Duyet truyen: /novels — 24-36 truyen/trang, the td.novel-cell
//   (bia cdn.wuxiaworld.com/images/covers/*.webp, tieu de, dong tag
//   "Ongoing · Fantasy, Comedy", tom tat); sap xep ?sort=popular/new/
//   chapters/name/rating; trang thai ?status=all/ongoing/completed/
//   hiatus; phan trang con tro ?after=<id> (link "Next page").
// - Tim kiem: API chinh GET /api/novels/search?query=<q>&count=30 tra
//   JSON {"items":[{id,name,slug,coverUrl,synopsis}],"result":true}
//   (GET tran tra items rong; POST khong can). Du phong: tim kiem lite
//   GET /novels?q=<q> (cung mau td.novel-cell).
// - Chi tiet lite: /novel/<slug> — h1 trong .novel-head, bia
//   .novel-head .cover img, dong meta p.muted.small ("Ongoing · Author:
//   ... · Translator: ... · N chapters"), tom tat trong div.chapter-body
//   sau h2 Synopsis. Trang chi tiet KHONG co the loai.
// - Muc luc: ul.toc li a — 100 muc/trang, phan trang ?toc=N (link
//   "Next" / "Previous"); ?toc vuot qua trang cuoi bi kep ve trang cuoi.
// - Chuong lite: /novel/<slug>/<chapter-slug> — tieu de h1, noi dung
//   div#chapter-body > p (moi p co data-uid, span ben trong), ghi chu
//   dich trong div[id^=footnote-] sau body.
// - Mo hinh khoa (kiem chung tu VM 2026-11-15, truyen Beyond the Zenith):
//   chuong dau doc du mien phi (ch.1-50: 9.400-15.100 ky tu); chuong
//   tiep theo chi co BAN XEM TRUOC ~900 ky tu, cat giua cau, ket bang
//   "..." (ch.51-151); chuong cao cap yeu cau dang nhap (ch.152-190:
//   "This chapter requires an account. Sign in to continue reading.");
//   chuong 191-194 khong co tren lite (404). JSON-LD tren web chinh ghi
//   isAccessibleForFree=false cho chuong xem truoc. Mo hinh khac nhau
//   theo truyen (Nine Star Hegemon Body Art: ch.1/40/89 deu du, khong
//   khoa) nen chap.js phat hien tai thoi diem mo chuong, khong hardcode.
// - The loai: KHONG co duyet theo the loai — lite khong co bo loc the
//   loai; API /api/novels bo qua tham so genre, truong genres luon rong,
//   khong co endpoint /api/genres. Vi vay genre.js DUOC BO (tien le
//   sachhayonline/aztruyen bo search.js khi site khong ho tro).
// - Dung UA mac dinh cua runtime (quy tac 10 AGENTS.md), khong set UA rieng.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://lite.wuxiaworld.com";
var API_URL = "https://www.wuxiaworld.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: khong co — www la SPA shell, khong phai ban lite.
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
    // Cung site, khac host (www / lite / http): doi ve BASE_URL (ban lite).
    var m = u.match(/^https?:\/\/(?:www\.|lite\.)?wuxiaworld\.com(\/.*)?$/i);
    if (m) {
        var path = m[1] || "/";
        // Bo ?full=1 (link "Switch to the full website" — lite tra cung noi dung).
        path = path.replace(/([?&])full=1(&|$)/, "$1").replace(/[?&]$/, "");
        return BASE_URL + path;
    }
    return u;
}

function absUrl(href) {
    if (!href) return "";
    return normalizeUrl(href);
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

function stripTags(s) {
    return cleanText(String(s || "").replace(/<[^>]+>/g, " "));
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
    if (!r.ok) return { error: rateLimitErr("WuxiaWorld", url, r) };
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}

// --- Parse danh sach truyen chung (trang duyet + ket qua tim kiem lite) ----
// Moi item: td.novel-cell > a.cover img (bia) + p.title a (ten + link);
// p.tag ("Ongoing · Fantasy, Comedy"), p.syn (tom tat).
function parseNovelItems(doc) {
    var items = [];
    var cells = doc.select("td.novel-cell");
    for (var i = 0; i < cells.size(); i++) {
        var el = cells.get(i);
        var a = selFirst(el, "p.title a");
        if (!a) continue;
        var link = absUrl(a.attr("href"));
        var name = cleanText(a.text());
        if (!link || !name) continue;
        var cover = "";
        var img = selFirst(el, "a.cover img");
        if (img) {
            cover = img.attr("src") || img.attr("data-src") || "";
            if (cover) cover = absUrl(cover);
        }
        var descParts = [];
        var tag = cleanText(el.select("p.tag").text());
        if (tag) descParts.push(tag);
        var syn = cleanText(el.select("p.syn").text());
        if (syn) descParts.push(syn);
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

// --- Token phan trang danh sach ---------------------------------------------
// Link "Next page" dang /novels?after=<id> (co the kem sort/status).
// Tra gia tri after, "" khi het trang.
function nextAfterToken(doc) {
    var links = doc.select("a[href*='after=']");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/[?&]after=([^&#]+)/);
        if (m) return m[1];
    }
    return "";
}

// --- URL trang ke tiep cua danh sach ----------------------------------------
// Trang 1 tra ve duong dan goc; trang sau them ?after=<token> (hoac
// &after= neu duong dan da co query nhu ?sort=new).
function listPageUrl(path, token) {
    if (!token) return path;
    if (path.indexOf("?") !== -1) return path + "&after=" + token;
    return path + "?after=" + token;
}
