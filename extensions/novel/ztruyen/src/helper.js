// helper.js — Ham dung chung cho ZTruyen (ztruyen.vn).
//
// Site VN, WordPress (theme truyenbiz.net), SSR day du cho danh sach /
// chi tiet / chuong (khong can giai ma, khong can WebView). Port tu
// lethituyen ztruyen v5 (fork tren dia) — NHUNG base da loi thoi hoan
// toan: site doi sang WordPress, URL cu dang /truyen/<slug>-<id> tra 404,
// selector cu (.cate-left-menu, .box-cate-list, #read-content) khong
// con tren site; extension nay viet moi tu khao sat site, chi giu ten +
// metadata cua base.
// - Danh sach: the truyen article.card-item (10 muc/trang) tren archive
//   the loai (/hien-dai/, 736 truyen), trang thai (/dang-cap-nhat/,
//   /hoan-thanh/ — 117 trang), tac gia (/tac-gia/<slug>/) va ket qua
//   tim kiem (/?s=<tu khoa>). Phan trang /page/N/ qua
//   a.next.page-numbers (tim kiem: /page/N/?s=<tu khoa>).
// - The loai: 37 the loai trong menu mega .gd-mega-cats cua trang chu
//   (kiem chung 2026-11-13); fallback cung neu fetch that bai.
// - Chi tiet: /<slug>/ — h1, anh bia og:image, mo ta #story-desc, hang
//   meta ul.meta-list (Tac gia / The loai / Trang thai / Luot xem).
// - Muc luc: POST ve /wp-admin/admin-ajax.php, action=theme_get_chaps,
//   nonce + storyId trich tu bien StoryAjax tren trang chi tiet, 52
//   chuong/trang, order=ASC, tra {success, data:{html, has_more}}.
//   HTML chuong dang li.chap-item > a.chap-link (kiem chung tu VM).
// - Chuong: /<slug>/<slug>-chuong-N/ — noi dung day du trong
//   div#chap-content-box (57 doan o ch.1 truyen mau, 85 doan o ch.704,
//   khong quang cao, khong can dang nhap, khong preview, khong khoa —
//   kiem chung tu VM 2026-11-13). Chuong VIP hien khong co tren site
//   (tag vip count=0, toc vip=1 tra rong) — chap.js van phong thu: gap
//   dau hieu khoa/mua thi bao loi tieng Viet, khong mo khoa.
// - Dung safeFirst() thay cho kiem tra truthy cua .first() (runtime
//   .first() khong bao gio tra null — xem FIRST-QUIRK-AUDIT.md).
// - Dung pacedFetch() cua lib/rate-limit.js (default headers + pacing
//   + retry 429/405/503).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Fetch 1 trang: tra {doc, rawHtml} hoac {error} -----------------------
// Doc rawHtml truoc roi Html.parse (chi doc body 1 lan — tranh double-read
// lam .html() tra null).
function fetchZtruyenPage(url, options) {
    options = options || {};
    var lastError = "";
    var r = null;
    try {
        r = pacedFetch(url, options);
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được trang: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("ZTruyen", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("ZTruyen", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) lastError = "Không tải được trang (HTTP " + st + "): " + url;
        else lastError = "Không tải được trang (lỗi mạng): " + url;
        return { error: lastError };
    }
    var rawHtml = "";
    try {
        rawHtml = r.res.text();
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!rawHtml) return { error: "Không đọc được nội dung trang: " + url };
    var doc = null;
    try {
        doc = Html.parse(rawHtml);
    } catch (e3) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!doc) return { error: "Không đọc được nội dung trang: " + url };
    if (isChallengeDoc(doc)) {
        return { error: "Trang đang yêu cầu xác minh Cloudflare — hãy mở ztruyen.vn trong trình duyệt của app một lần rồi thử lại." };
    }
    return { doc: doc, rawHtml: rawHtml };
}

// --- Tien ich URL / text ---------------------------------------------------
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

// --- Thu thap the truyen tu 1 trang danh sach -------------------------------
// The truyen: article.card-item > a.thumb (anh bia) + h3.card-title a
// (ten) + .meta-author .author (tac gia) + a.chap-left (chuong moi
// nhat). 10 muc/trang tren moi archive va ket qua tim kiem.
function collectArchiveCards(doc) {
    var items = [];
    var seen = {};

    function pushItem(name, link, cover, description) {
        if (!name || !link) return;
        var full = normalizeUrl(link);
        if (!full || seen[full]) return;
        seen[full] = true;
        items.push({ name: name, link: full, cover: cover || "", description: description || "", host: BASE_URL });
    }

    var cards = doc.select("article.card-item");
    for (var i = 0; i < cards.size(); i++) {
        var e = cards.get(i);
        var titleA = safeFirst(e.select("h3.card-title a"));
        if (!titleA) titleA = safeFirst(e.select("a.thumb"));
        if (!titleA) continue;
        var href = String(titleA.attr("href") || "").trim();
        if (!href) continue;
        var name = cleanText(titleA.text());
        if (!name) continue;
        var img = safeFirst(e.select("a.thumb img"));
        var cover = "";
        if (img) {
            var src = String(img.attr("src") || "").trim();
            if (src) cover = normalizeUrl(src);
        }
        var authorEl = safeFirst(e.select(".meta-author .author"));
        var desc = authorEl ? cleanText(authorEl.text()) : "";
        pushItem(name, href, cover, desc);
    }
    return items;
}

// --- Phan trang danh sach ---------------------------------------------------
// Lay so trang ke tu a.next.page-numbers (href dang /.../page/N/ hoac
// /page/N/?s=<tu khoa>). Tra "" neu het trang.
function detectNextPageToken(doc) {
    var nextEl = safeFirst(doc.select("a.next.page-numbers"));
    if (!nextEl) return "";
    var href = String(nextEl.attr("href") || "").trim();
    if (!href || href.indexOf("javascript:") === 0 || href === "#") return "";
    var m = href.match(/\/page\/(\d+)\//);
    if (m) return m[1];
    return "";
}

// Chen /page/N/ vao URL archive (truoc query string neu co). Trang 1
// tra nguyen URL.
function buildArchivePageUrl(url, page) {
    var p = parseInt(page, 10);
    if (isNaN(p) || p <= 1) return url;
    var clean = String(url || "").split("#")[0];
    var q = clean.indexOf("?");
    var base = q >= 0 ? clean.substring(0, q) : clean;
    var query = q >= 0 ? clean.substring(q + 1) : "";
    base = base.replace(/\/+$/, "");
    var out = base + "/page/" + String(p) + "/";
    if (query) out += "?" + query;
    return out;
}

// --- Trich StoryAjax (nonce + storyId) tu trang chi tiet -------------------
// Dang that trong HTML (kiem chung 2026-11-13):
//   var StoryAjax = {"url":".../wp-admin/admin-ajax.php",
//     "nonce":"bda08190a8","perPage":"52","storyId":"224237",...};
// Tra {nonce, storyId} hoac null.
function extractStoryAjax(raw) {
    var m = String(raw || "").match(/var StoryAjax\s*=\s*(\{[^}]*\})/);
    if (!m) return null;
    var nonce = m[1].match(/"nonce"\s*:\s*"([^"]+)"/);
    var storyId = m[1].match(/"storyId"\s*:\s*"([^"]+)"/);
    if (!nonce || !storyId) return null;
    return { nonce: nonce[1], storyId: storyId[1] };
}

// --- Trich so chuong moi nhat tu nut "Doc tap moi" ------------------------
// href dang /<slug>/<slug>-chuong-N.../ — N la so chuong moi nhat,
// dung de tinh so trang muc luc (52 chuong/trang). Tra 0 neu khong
// trich duoc (vd. truyen chua co chuong).
function extractLatestChapterNum(doc) {
    var btn = safeFirst(doc.select("a.btn-latest"));
    if (!btn) return 0;
    var href = String(btn.attr("href") || "");
    var m = href.match(/-chuong-(\d+)/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return isNaN(n) ? 0 : n;
}

// --- Goi AJAX muc luc theme_get_chaps --------------------------------------
// POST ve /wp-admin/admin-ajax.php (can Referer la trang chi tiet —
// khong co Referer request tung timeout o lan thu dau tu VM).
// Tra {items, hasMore} hoac {error}.
function fetchChapPage(detailUrl, ajax, pageNum) {
    var body = "action=theme_get_chaps" +
        "&nonce=" + encodeURIComponent(ajax.nonce) +
        "&post_id=" + encodeURIComponent(ajax.storyId) +
        "&page=" + encodeURIComponent(String(pageNum)) +
        "&vip=0&per_page=52&order=ASC&s=";
    var res = null;
    try {
        res = pacedFetch(BASE_URL + "/wp-admin/admin-ajax.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest"
            },
            referer: detailUrl,
            body: body
        });
    } catch (e) {
        return { error: "Không tải được mục lục (lỗi mạng): " + e };
    }
    if (!res) return { error: "Không tải được mục lục." };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("ZTruyen", pacedHostOf(BASE_URL), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("ZTruyen", pacedHostOf(BASE_URL), res.cooldownRemainingMs) };
        }
        return { error: "Không tải được mục lục (HTTP " + st + ")." };
    }
    var text = "";
    try {
        text = String(res.res.text());
    } catch (e2) {
        return { error: "Không đọc được mục lục." };
    }
    var data = null;
    try {
        data = JSON.parse(text);
    } catch (e3) {
        return { error: "Không đọc được mục lục (site trả về không phải JSON)." };
    }
    if (!data || !data.success || !data.data) {
        return { error: "Không tải được mục lục (site trả về lỗi)." };
    }
    var html = String(data.data.html || "");
    var hasMore = !!data.data.has_more;
    var items = [];
    if (html) {
        var frag = null;
        try {
            frag = Html.parse(html);
        } catch (e4) {
            frag = null;
        }
        if (frag) {
            var links = frag.select("li.chap-item a.chap-link");
            for (var i = 0; i < links.size(); i++) {
                var a = links.get(i);
                var href = String(a.attr("href") || "").trim();
                var name = cleanText(a.text());
                if (!href || !name) continue;
                var liHtml = "";
                try {
                    var li = a.parent();
                    if (li) liHtml = String(li.html() || "").toLowerCase();
                } catch (e5) {
                }
                var locked = liHtml.indexOf("vip") !== -1 ||
                    liHtml.indexOf("crown") !== -1 ||
                    liHtml.indexOf("fa-lock") !== -1 ||
                    liHtml.indexOf("lock") !== -1;
                var entry = {
                    name: locked ? "[VIP] " + name : name,
                    url: normalizeUrl(href),
                    host: BASE_URL
                };
                if (locked) {
                    entry.pay = true;
                    entry.lock = true;
                }
                items.push(entry);
            }
        }
    }
    return { items: items, hasMore: hasMore };
}
