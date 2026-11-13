// helper.js — Ham dung chung cho Truyen Mo (truyenmo.one).
//
// Site VN, SSR day du (khong can giai ma GBK, khong can WebView).
// Port tu kychi truyenmo v4 (fork tren dia, src doc duoc), viet lai theo
// quy tac nha (AGENTS.md §6):
// - BO User-Agent mobile cung trong base (site tra 200 day du ca khi
//   khong co UA — kiem chung tu VM 2026-11-13), dung pacedFetch() cua
//   lib/rate-limit.js (default headers + pacing + retry 429/405/503).
// - Dung safeFirst() thay cho kiem tra truthy cua .first() (runtime
//   .first() khong bao gio tra null — xem FIRST-QUIRK-AUDIT.md).
// - BO page.js: muc luc DAY DU ngay tren trang chi tiet, ke ca truyen
//   1.353 chuong (kiem chung: Co Thieu Gia Xin Hay Nhe Nhang, 1.353 link
//   chuong trong 1 trang detail, khong phan trang).
// - Trang chi tiet KHONG co truong "Trang thai" (chi co Cap nhat / Loai /
//   Tac gia / The loai / Team / Luot xem) — meta description cung la
//   template co dinh "Da full (Hoan thanh)" cho ca truyen dang ra, nen
//   KHONG phan biet duoc Hoan thanh / Dang ra tu trang chi tiet;
//   detail.js mac dinh ongoing=true (ghi nhan la diem mo).
// - Chuong co span chong copy: <span class="u-..."></span> rong, noi dung
//   that nam trong CSS :before {content:"..."} — giai ma bang
//   extractBeforeContentMap() + decodeObfuscatedSpan() (goc kychi).
// - Chuong doc DU, khong can dang nhap, khong preview, khong 401, khong
//   VIP (kiem chung tu VM 2026-11-13: ch.1 Am Ve Cua Vuong Gia, 207KB,
//   mo dau "Tiet troi dau xuan luc am luc lanh..." — dung truyen goc).
// - The loai: /the-loai/<slug>.html, 24 truyen/trang, phan trang
//   ?page=N. Tim kiem: GET /tim-kiem?search=<kw> (tra 1 ket qua cho
//   "am ve"). Danh sach: /truyen-moi.html, /truyen-hoan-thanh.html,
//   /bang-xep-hang.html.
// - Binh luan: GET /ajax/showComment?story_id=<id>&btnComment=1&num=1
//   &page=N&type=comment (kiem chung: story 211 tra 9 binh luan).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Fetch 1 trang: tra {doc, rawHtml} hoac {error} -----------------------
// Doc rawHtml truoc roi Html.parse (chi doc body 1 lan — tranh double-read
// lam .html() tra null). Thu URL goc truoc, roi mirror (mirror 301 ve
// .one nen fetch() theo redirect).
function fetchTruyenmoPage(url, options) {
    options = options || {};
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var r = null;
        try {
            r = pacedFetch(candidates[i], options);
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        if (!r) {
            lastError = "Không tải được trang: " + url;
            continue;
        }
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("Truyện Mơ", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Truyện Mơ", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
            } else {
                lastError = "Không tải được trang (lỗi mạng): " + url;
            }
            continue;
        }
        var rawHtml = "";
        try {
            rawHtml = r.res.text();
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!rawHtml) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        var doc = null;
        try {
            doc = Html.parse(rawHtml);
        } catch (e3) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (isChallengeDoc(doc)) {
            lastError = "Trang đang yêu cầu xác minh Cloudflare — hãy mở truyenmo.one trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc, rawHtml: rawHtml };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// --- Tien ich URL / text (goc kychi, giu nguyen) ---------------------------
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

function buildPageUrl(url, page) {
    // Runtime vBook (Rhino ES6) KHONG co URLSearchParams — dung xu ly
    // chuoi thuan. Giu nguyen cac query param khac, thay page=N.
    var p = parseInt(page, 10);
    if (isNaN(p) || p <= 1) return url;
    var clean = String(url || "").split("#")[0];
    var q = clean.indexOf("?");
    var base = q >= 0 ? clean.substring(0, q) : clean;
    var query = q >= 0 ? clean.substring(q + 1) : "";
    var parts = query ? query.split("&") : [];
    var kept = [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf("page=") !== 0) kept.push(parts[i]);
    }
    kept.push("page=" + String(p));
    return base + "?" + kept.join("&");
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// --- Phan trang danh sach ---------------------------------------------------
// Lay token trang ke: SO TRANG trong URL trang ke (vd. ?page=2 -> "2").
// Neu URL khong co page thi lay trang hien tai + 1. (Ban cu parse so
// trang roi +1 — sai: trang 1 tra token "3", lam app bo qua trang 2.)
function extractPageToken(url, currentPage) {
    var m = String(url || "").match(/[?&]page=(\d+)/);
    if (m) return m[1];
    var page = parseInt(currentPage, 10);
    if (isNaN(page) || page < 1) page = 1;
    return String(page + 1);
}

// Tim link "trang ke" trong phan trang cua site (ul.pagination).
// Tra URL day du hoac "" neu khong co.
function detectNextPage(doc, currentUrl) {
    var nextEl = safeFirst(doc.select(".pagination li.active + li a"));
    var href = nextEl ? String(nextEl.attr("href") || "").trim() : "";
    if (href && href.indexOf("javascript:") !== 0 && href !== "#") {
        return normalizeUrl(href);
    }
    return "";
}

// --- Thu thap the truyen tu 1 trang danh sach -------------------------------
// Site dung 2 layout: trang chu dung .single-story-block, trang the loai /
// tim kiem dung .row.product-grid > div.col-md-3 > .card. Ca 2 deu co
// the <a> chua img + .card-title lam ten (trong layout card, the <a>
// chi bao <img> nen ten phai lay tu .card-title).
function collectStoryCards(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select(".single-story-block, .row.product-grid > div");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var link = safeFirst(card.select("a[href*='.html']"));
        if (!link) link = safeFirst(card.select("a[href]"));
        if (!link) continue;
        var href = String(link.attr("href") || "").trim();
        if (!href || href.indexOf("javascript:") === 0 || href === "#") continue;
        var full = normalizeUrl(href);
        if (seen[full]) continue;
        seen[full] = true;
        var titleEl = safeFirst(card.select(".card-title"));
        var name = titleEl ? cleanText(titleEl.text()) : "";
        if (!name) name = cleanText(link.attr("title") || "");
        if (!name) name = cleanText(link.text());
        if (!name) continue;
        var img = safeFirst(card.select("img"));
        var cover = "";
        if (img) {
            cover = String(img.attr("data-src") || img.attr("src") || "").trim();
            if (cover) cover = normalizeUrl(cover);
        }
        var descEl = safeFirst(card.select(".last_chapter, .single-story-details, .card-text"));
        var description = descEl ? cleanText(descEl.text()) : "";
        items.push({ name: name, link: full, cover: cover, description: description, host: BASE_URL });
    }
    return items;
}

// Lay map class -> noi dung that tu cac rule CSS :before trong raw HTML.
function extractBeforeContentMap(rawHtml) {
    var map = {};
    if (!rawHtml) return map;
    var re = /\.([a-zA-Z0-9_-]+):before\s*\{\s*content\s*:\s*(["'])((?:\\.|(?!\2).)*)\2/g;
    var m;
    while ((m = re.exec(rawHtml)) !== null) {
        var value = m[3].replace(/\\(.)/g, "$1");
        map[m[1]] = value;
    }
    return map;
}

// --- Giai ma span chong copy (:before content) ------------------------------
// Site chen <span class="u-..."></span> rong vao giua cau; chu that nam
// trong CSS: .u-...:before {content:"..."} (77 rule/trang chuong).
// Giai ma tren CHUOI HTML (thay span rong bang chu that) TRUOC KHI
// Html.parse — runtime vBook khong co Element.before() nen khong the
// chen text vao DOM sau khi parse. Chu that duoc escape HTML de khong
// vo cau truc trang.
function decodeObfuscatedHtml(html, rawHtml) {
    if (!html) return html;
    var map = extractBeforeContentMap(rawHtml);
    return String(html).replace(/<span\s+class="([a-zA-Z0-9_-]+)"\s*>\s*<\/span>/g, function(m, cls) {
        var content = map[cls];
        if (content === undefined || content === "") return "";
        return escapeHtmlText(content);
    });
}

function escapeHtmlText(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
