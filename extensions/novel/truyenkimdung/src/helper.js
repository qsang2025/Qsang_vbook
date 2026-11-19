// helper.js — Ham dung chung cho Truyen Kim Dung (truyenkimdung.net).
//
// Site HTML tinh phia server (kiem chung live 2026-11-19): thu vien vo
// hiep Kim Dung, tron 20 bo tai trang chu (phan trang ?page=N&pageSize=10,
// trang 1 khong co tham so page, link "Sau" trong .pagination-links).
// - Danh sach: the a.story-card (href /truyen/<slug>), bia o .cover img,
//   ten o h2, thong tin o .meta span (luot doc, sao, tong thoi gian doc),
//   nhan phien ban + so chuong o .cover-tags span.
// - Loc phien ban qua GET /?version=<Ban cu|Truyen ngan|Tan tu> (gia tri
//   tieng Viet co dau, phai encodeURIComponent). Tim kiem qua /?q=<tu khoa>
//   (SearchAction cua site, SSR — khong can API /tracuu/api/stories).
// - Chi tiet: /truyen/<slug>; ten o h1.story-title, bia o .story-hero
//   .cover img (og:image la anh chung cua site, chi dung lam du phong),
//   mo ta o p.story-description, cac nhan .pill (trang thai, phien ban,
//   so chuong, luot doc). Tac gia Kim Dung (JSON-LD author).
// - Muc luc nam ngay tren trang chi tiet: .chapter-items li a, moi chuong
//   gom span "Hoi N" + strong ten hoi; href /truyen/<slug>/hoi-<n>-<slug>.
// - Chuong: noi dung o #reader-content (.reader-content), cac doan <p>;
//   tieu de o .chapter-title (va data-chapter-title tren article.reader).
//   Chuong doc du, khong login/VIP (dang nhap chi de binh luan).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchTkDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Truyện Kim Dung", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Truyện Kim Dung", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    var doc = null;
    try {
        doc = docFromResponse(res.res, url);
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!doc) return { error: "Không đọc được nội dung trang: " + url };
    return { doc: doc };
}

// Parser MOT the truyen a.story-card thanh doi tuong truyen
// { name, cover, link, description, author, host } hoac null.
function parseBookCard(card) {
    var href = card.attr("href") || "";
    if (!href || href.indexOf("/truyen/") === -1) return null;
    var link = absUrl(href);
    if (!link) return null;

    var nameEl = safeFirst(card.select("h2"));
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return null;

    var cover = "";
    var coverImg = safeFirst(card.select(".cover img"));
    if (coverImg !== null) cover = absUrl(coverImg.attr("src") || "");

    // Mo ta ngan: nhan phien ban + so chuong (.cover-tags) va luot doc (.meta).
    var parts = [];
    card.select(".cover-tags span").forEach(function (el) {
        var t = cleanText(el.text());
        if (t) parts.push(t);
    });
    var metaEl = safeFirst(card.select(".meta span"));
    if (metaEl !== null) {
        var mt = cleanText(metaEl.text());
        if (mt) parts.push(mt);
    }

    return {
        name: name,
        cover: cover,
        link: link,
        description: parts.join(" • "),
        author: "Kim Dung",
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho gen.js / search.js).
// Tra ve mang truyen (dedupe theo link).
function parseBookList(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select("a.story-card");
    cards.forEach(function (card) {
        var item = parseBookCard(card);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang danh sach ("") = het. Site dung link "Sau"
// trong .pagination-links (href /?page=N&pageSize=10, giu nguyen tham so
// loc cua site nen tra nguyen href tuyet doi lam token trang sau). Link
// "Truoc" bi disable o trang 1 (href page=0) — khong dung.
function nextPageUrl(doc) {
    var links = doc.select(".pagination-links a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        if (!el) continue;
        var cls = el.attr("class") || "";
        if (cls.indexOf("disabled") !== -1) continue;
        if (cleanText(el.text()) !== "Sau") continue;
        var href = cleanText(el.attr("href") || "");
        if (!href || href === "#") return "";
        if (href.indexOf("http") === 0) return href;
        return absUrl(href);
    }
    return "";
}

// Gan / doi tham so page=N tren mot URL danh sach (dung cho token trang
// dang so "2" khi test tay; token URL day du duoc uu tien hon).
function withPageParam(url, pageNum) {
    var n = parseInt(pageNum, 10);
    if (isNaN(n) || n < 1) return url;
    if (/([?&])page=\d+/.test(url)) return url.replace(/([?&])page=\d+/, "$1page=" + n);
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + n;
}
