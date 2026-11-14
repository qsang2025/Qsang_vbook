// config.js — Cau hinh cho extension TrichTinhLau (trichtinhlau.com).
//
// Site VN (Laravel, SSR). Trang chi tiet /xem-truyen/<slug>, chuong
// /doc-truyen/<slug>/chuong-N. Kiem chung tu VM 2026-11-14:
// - Chan bot theo UA: UA mac dinh (curl/okhttp) bi 403 "Truy cap bi chan"
//   o /xem-truyen/ va /doc-truyen/; UA Chrome (desktop/mobile) tra 200.
//   Nen moi request dung UA mobile Chrome co dinh (ngoai le co bang chung
//   cho quy tac 10 AGENTS.md, nhu Tadu).
// - Trang chuong can Referer la trang chi tiet (kiem chung VM: Referer
//   trang chu van 403). chap.js tu suy ra URL chi tiet tu URL chuong.
// - Site gioi han toc do theo IP: dot request day dac tu VM bi 403 tam
//   thoi. Test tren may: 1 request/lan, cach nhau >= 3 giay.
// - Noi dung chuong nam trong <div id="chapterContentEncoded"
//   data-encoded="base64(HTML)"> (giai ma khong khoa, khong co khoa);
//   runtime khong co atob nen tu viet base64 bang JS thuan (xem
//   b64decodeUtf8 ben duoi). Ban dich tu data-encoded sach: khong co
//   the script, khong co khoang cam in, khong co span data-text (kiem
//   chung chuong 1 truyen mau tren may that: 101 doan <p>, 9.773 byte).
// - Mot so chuong co diamonds_active=1 trong API (can Kim Cuong de doc);
//   HTML muc luc KHONG danh dau chuong nao bi khoa. chap.js tra loi
//   tieng Viet ro rang khi gap chuong khoa, khong mo khoa.
// - "Doi full" (mua tron bo) tinh theo Kim Cuong tung truyen; truyen
//   mau 0 Kim Cuong (mien phi). Gia nay dua vao truong detail.
// - Muc luc du 1 lan tren trang chi tiet (truyen 31 chuong, kiem chung);
//   truyen nhieu chuong chua kiem chung phan trang — toc.js van thu
//   ?page=N khi co link trang sau.
// - The loai "Incest" co tren site nhung KHONG dua vao danh sach the
//   loai cua extension (quy tac nha: khong dua noi dung NSFW vao catalog
//   chung); truyen co the loai do van tim duoc qua tim kiem / danh sach.
// - Khong co mirror da kiem chung. Chi dung domain chinh.
// - API /api/newupdatestory?page=N tra JSON {current_page, data[],
//   next_page_url, last_page} (547 truyen, 20/trang); moi muc co
//   tentruyen/author/slug_post/image/view/status/chapter[] (chapter[]
//   kem diamonds_active/stars_active tung chuong). PHAN TRANG API HONG
//   PHIA SERVER (kiem chung VM + may that 2026-11-14): goi ?page=2 van
//   tra current_page=1, from=1, to=20, 20 muc giong het trang 1 (ca
//   next_page_url cung dung o ?page=2). Chi dung duoc trang 1 — token
//   trang ke luon "" (chinh site cung chi goi API khong tham so page).
// - Tab "Doc nhieu" KHONG dung API (khong co tham so sap xep): lay tu
//   trang xep hang /bang-xep-hang/thang/doc-nhieu?page=N (24 muc/trang,
//   the li.xianxia-item, phan trang Laravel ?page=N hoat dong).
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js.

var BASE_URL = "https://trichtinhlau.com";

// Domain co the doi trong cai dat nguon (trichtinhlau.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung. Chi dung domain chinh.
var MIRROR_LIST = [];

var IMG_BASE = BASE_URL + "/uploads/truyen/";

// UA mobile Chrome co dinh (xem ghi chu dau file ve chan bot theo UA).
var SITE_UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

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

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// Lay phan tu dau tien cua mot select (tranh bay .first() cua runtime:
// select rong van tra ve object truthy — xem FIRST-QUIRK-AUDIT.md).
function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

// --- Giai ma base64 -> chuoi UTF-8 (JS thuan; runtime khong co atob) ------
var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function b64decodeUtf8(b64) {
    var s = String(b64 || "").replace(/[^A-Za-z0-9+/=]/g, "");
    var bytes = [];
    var i = 0;
    while (i < s.length) {
        var c1 = B64_CHARS.indexOf(s.charAt(i++));
        var c2 = B64_CHARS.indexOf(s.charAt(i++));
        var c3 = B64_CHARS.indexOf(s.charAt(i++));
        var c4 = B64_CHARS.indexOf(s.charAt(i++));
        if (c1 < 0 || c2 < 0) break;
        bytes.push((c1 << 2) | (c2 >> 4));
        if (c3 >= 0) bytes.push(((c2 & 15) << 4) | (c3 >> 2));
        if (c4 >= 0) bytes.push(((c3 & 3) << 6) | c4);
    }
    var out = "";
    var j = 0;
    while (j < bytes.length) {
        var b = bytes[j++];
        if (b < 0x80) {
            out += String.fromCharCode(b);
        } else if ((b & 0xE0) === 0xC0) {
            var b2 = bytes[j++] || 0;
            out += String.fromCharCode(((b & 0x1F) << 6) | (b2 & 0x3F));
        } else if ((b & 0xF0) === 0xE0) {
            var b2a = bytes[j++] || 0;
            var b3a = bytes[j++] || 0;
            out += String.fromCharCode(((b & 0x0F) << 12) | ((b2a & 0x3F) << 6) | (b3a & 0x3F));
        } else if ((b & 0xF8) === 0xF0) {
            var b2b = bytes[j++] || 0;
            var b3b = bytes[j++] || 0;
            var b4b = bytes[j++] || 0;
            var cp = ((b & 0x07) << 18) | ((b2b & 0x3F) << 12) | ((b3b & 0x3F) << 6) | (b4b & 0x3F);
            cp -= 0x10000;
            out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
        }
    }
    return out;
}

// --- Fetch co pacing (dung pacedFetch cua file rate-limit.js) -------------
// Tra {doc} hoac {error}. Khong retry 403 (thuong la chan bot theo UA /
// gioi han toc do tam thoi); 429/405 thi ghi cooldown, khong dung
// browser fallback (cung IP, vo ich — quy tac 11 AGENTS.md).
function ttlFetchDoc(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/"), headers: { "User-Agent": SITE_UA } });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Trích Tinh Lâu", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Trích Tinh Lâu", pacedHostOf(url), r.cooldownRemainingMs) };
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

// GET JSON: tra {data} hoac {error}. Kiem tra trang challenge truoc khi
// JSON.parse (trang challenge tra HTTP 200 nhung khong phai JSON).
function ttlFetchJson(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/"), headers: { "User-Agent": SITE_UA } });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Trích Tinh Lâu", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Trích Tinh Lâu", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!text) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    if (typeof isChallengeText === "function" && isChallengeText(text)) {
        return { error: "Trang đang yêu cầu xác minh — hãy mở trichtinhlau.com trong trình duyệt của app một lần rồi thử lại." };
    }
    try {
        return { data: JSON.parse(text) };
    } catch (e3) {
        return { error: "Không đọc được dữ liệu (JSON lỗi): " + url };
    }
}

// Ten the co the co tien to "Xem truyện " (thuoc tinh title cua the a
// tren trang tim kiem — vd title='Xem truyện Ten Sach') — bo tien to
// nay de ten sach sach.
function stripXemTruyen(name) {
    return String(name || "").replace(/^Xem truyện\s+/i, "").trim();
}

// --- Parse danh sach truyen dang the card ----------------------------------
// The card chuan: <article class="... item ..."> chua <a href="/xem-truyen/...">
// (anh bia) + <h5 class="card-title">ten truyen</h5> + <img data-src/src>.
// Trang tim kiem khong dung article.item ma dung div.col-md-2 (cung cau
// truc anh + h5.card-title) — thu ca hai. Neu khong thay the card nao
// thi roi ve quet truc tiep cac link xem-truyen (bo qua link chi co anh
// banner, ten rong).
function parseCards(doc) {
    var result = [];
    var seen = {};
    var cards = doc.select("article.item");
    if (cards.size() === 0) cards = doc.select("div.col-md-2");
    if (cards.size() > 0) {
        for (var i = 0; i < cards.size(); i++) {
            var card = cards.get(i);
            var a = selFirst(card, "a[href*='/xem-truyen/']");
            if (!a) continue;
            var href = a.attr("href");
            if (!href || seen[href]) continue;
            seen[href] = true;
            var titleEl = selFirst(card, "h5.card-title");
            var name = titleEl ? cleanText(titleEl.text()) : "";
            if (!name) name = a.attr("title") || "";
            if (!name) {
                var imgAlt = selFirst(card, "img");
                if (imgAlt) name = imgAlt.attr("alt") || "";
            }
            name = stripXemTruyen(name);
            if (!name) continue;
            var imgEl = selFirst(card, "img");
            var cover = "";
            if (imgEl) cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
            var link = href.indexOf("http") === 0 ? href : BASE_URL + href;
            result.push({ name: name, link: link, host: BASE_URL, cover: cover, description: "" });
        }
        return result;
    }
    var links = doc.select("a[href*='/xem-truyen/']");
    for (var j = 0; j < links.size(); j++) {
        var a2 = links.get(j);
        var href2 = a2.attr("href");
        if (!href2 || seen[href2]) continue;
        var name2 = stripXemTruyen(a2.attr("title") || cleanText(a2.text()));
        if (!name2 || name2.length < 2) continue;
        if (name2 === "xem truyện" || name2 === "Xem truyện") continue;
        seen[href2] = true;
        var imgEl2 = selFirst(a2, "img");
        var cover2 = "";
        if (imgEl2) cover2 = imgEl2.attr("data-src") || imgEl2.attr("src") || "";
        if (cover2 && cover2.charAt(0) === 47) cover2 = BASE_URL + cover2;
        var link2 = href2.indexOf("http") === 0 ? href2 : BASE_URL + href2;
        result.push({ name: name2, link: link2, host: BASE_URL, cover: cover2, description: "" });
    }
    return result;
}

// Token trang ke: so trang tiep theo (chuoi), "" khi het. Tim link
// ?page=N+1; neu khong co thi dem so trang lon nhat trong .pagination.
function getNextPage(doc, current) {
    var next = selFirst(doc, "a[href*='page=" + (current + 1) + "']");
    if (next) return String(current + 1);
    var pager = selFirst(doc, ".pagination");
    if (!pager) return "";
    var links = pager.select("a");
    var maxNum = 0;
    for (var i = 0; i < links.size(); i++) {
        var t = parseInt(links.get(i).text().trim(), 10);
        if (!isNaN(t) && t > maxNum) maxNum = t;
    }
    if (maxNum > current) return String(current + 1);
    return "";
}

// Mo trang bang WebView headless (chi dung lam du phong khi fetch thuong
// khong lay duoc noi dung — WebView dung UA trinh duyet that nen co the
// qua duoc chan bot theo UA; KHONG dung khi dang bi cooldown 429/405).
function fetchBrowser(url, timeout) {
    var t = timeout || 15000;
    var browser = Engine.newBrowser();
    try {
        return browser.launch(url, t);
    } finally {
        browser.close();
    }
}
