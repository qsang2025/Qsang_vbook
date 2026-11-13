// helper.js — Ham dung chung cho TruyenTV (tvtruyen.space).
//
// Site VN, SSR day du (khong can giai ma GBK, khong can WebView).
// Port tu kychi truyentv v7 (fork tren dia, src doc duoc), viet lai theo
// quy tac nha (AGENTS.md §6):
// - BO User-Agent mobile cung trong base (site tra 200 day du ca khi
//   khong co UA — kiem chung tu VM 2026-11-13, trang chu 395KB voi ca 3
//   UA desktop / khong UA / mobile), dung pacedFetch() cua
//   lib/rate-limit.js (default headers + pacing + retry 429/405/503).
// - Dung safeFirst() thay cho kiem tra truthy cua .first() (runtime
//   .first() khong bao gio tra null — xem FIRST-QUIRK-AUDIT.md).
// - BO tab "Truyen VIP" va tab "Luu y bat VPN" cua base: chi doc noi dung
//   mien phi; site doc duoc khong can VPN (kiem chung tu VM) nen khong
//   can tab nhac bat VPN.
// - BO page.js cua base? KHONG — muc luc phan trang 50 chuong/trang
//   (?page=N, toi 25 trang voi truyen ~1.250 chuong) nen GIU page.js.
// - JSON-LD tren trang chi tiet KHONG parse duoc (description chua
//   xuong dong tho — JSON.parse loi) nen detail.js doc DOM truc tiep,
//   khong dua vao JSON-LD.
// - Chuong: noi dung day du trong #chapter-content (khong can dang nhap,
//   khong preview, khong 401, khong khoa — kiem chung tu VM 2026-11-13:
//   ch.1 Tu Hai Nhi Bat Dau Nhap Dao 100+ doan, mo dau "Dau dau du doi!";
//   ch.98 42 doan, mo dau "Danh co cung vay."; ch.1 Gio ben canh le
//   72 doan — dung truyen goc). Chap.js chi strip .signature (dong quang
//   ba "Truyen duoc dang tai duy nhat tai TruyenTV") + quang cao.
// - The loai: /the-loai liet ke ~200 the loai dang /the-loai/<slug>.html;
//   genre.js doc live, co fallback cung. Danh sach: .comic-card (trang
//   chu, 40 muc) + .info-mobile-card TRONG .col-truyen-main (trang the
//   loai/tim kiem, 15 muc/trang — sidebar chua them 30 the giong het nen
//   BAT BUOC pham vi, khong lay toan trang); phan trang
//   .custom-pagination-list ?page=N.
// - Tim kiem: GET /tim-kiem?tukhoa=<slug-khong-dau>&page=N — site tu
//   slug-hoa tu khoa co dau (301 ve dang khong dau) nen search.js slug-hoa
//   truoc nhu base.
// - Binh luan: QQ Comment Service — GET /api/comments?commentable_type=
//   comics&commentable_id=<data-id o #comment-wrapper>&page=N&direction=
//   desc, tra {html, pagination:{current_page,last_page}} (kiem chung:
//   truyen Tu Hai Nhi 8 binh luan, last_page 1).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Fetch 1 trang: tra {doc, rawHtml} hoac {error} -----------------------
// Doc rawHtml truoc roi Html.parse (chi doc body 1 lan — tranh double-read
// lam .html() tra null). Thu URL goc truoc, roi mirror (mirror 301 ve
// .space nen fetch() theo redirect).
function fetchTvPage(url, options) {
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
            return { error: rateLimitErrorMessage("TruyenTV", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("TruyenTV", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
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
            lastError = "Trang đang yêu cầu xác minh Cloudflare — hãy mở www.tvtruyen.space trong trình duyệt của app một lần rồi thử lại.";
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

// Slug-hoa tu khoa tieng Viet thanh dang khong dau (site tu redirect
// tu khoa co dau ve dang slug nay — kiem chung 2026-11-13).
function toSlug(str) {
    if (!str) return "";
    var slug = String(str).toLowerCase();
    var from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
    var to = "";
    var i = 0;
    for (i = 0; i < 17; i++) to += "a";
    for (i = 0; i < 11; i++) to += "e";
    for (i = 0; i < 5; i++) to += "i";
    for (i = 0; i < 17; i++) to += "o";
    for (i = 0; i < 11; i++) to += "u";
    for (i = 0; i < 5; i++) to += "y";
    to += "d";
    for (i = 0; i < from.length; i++) {
        slug = slug.split(from.charAt(i)).join(to.charAt(i));
    }
    return slug.replace(/[^a-z0-9\- ]/g, "")
               .replace(/\s+/g, "-")
               .replace(/\-+/g, "-")
               .replace(/^\-+|\-+$/g, "");
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

// Tim link "trang ke" trong phan trang cua site
// (ul.custom-pagination-list li.nav-next a). Tra URL day du hoac "".
function detectNextPage(doc) {
    var nextEl = safeFirst(doc.select(".custom-pagination-list .nav-next a"));
    if (!nextEl) nextEl = safeFirst(doc.select(".pagination .nav-next a"));
    if (!nextEl) nextEl = safeFirst(doc.select(".pagination li.active + li a"));
    if (!nextEl) return "";
    var href = String(nextEl.attr("href") || "").trim();
    if (!href || href.indexOf("javascript:") === 0 || href === "#") return "";
    return normalizeUrl(href.split("#")[0]);
}

// --- Thu thap the truyen tu 1 trang danh sach -------------------------------
// Site dung 2 layout: trang chu dung .comic-card, trang the loai / tim
// kiem dung .info-mobile-card (45/30 muc/trang), fallback .list-truyen
// .row. Ca 2 layout deu co the <a> + img + ten.
function collectStoryCards(doc) {
    var items = [];
    var seen = {};

    function pushItem(name, link, cover, description) {
        if (!name || !link) return;
        var full = normalizeUrl(link);
        if (!full || seen[full]) return;
        seen[full] = true;
        items.push({ name: name, link: full, cover: cover || "", description: description || "", host: BASE_URL });
    }

    // 1. .comic-card (trang chu: Truyen Hot / sliders / grids) — chi lay
    // trong cot chinh .col-truyen-main (sidebar .sidebar-right chua
    // .hot-item ngay/tuan/thang, khong phai comic-card, nhung cu pham vi
    // cho chac).
    var cards = doc.select(".col-truyen-main .comic-card");
    if (cards.size() === 0) cards = doc.select(".comic-card");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var e = cards.get(i);
        var a = safeFirst(e.select(".comic-title a, a[itemprop=\"url\"]"));
        if (!a) a = safeFirst(e.select("a"));
        if (!a) continue;
        var nameEl = safeFirst(e.select(".comic-title h3, h3[itemprop=\"name\"], h3"));
        var name = nameEl ? cleanText(nameEl.text()) : cleanText(a.attr("title") || a.text());
        var img = safeFirst(e.select("img.item-img, img[itemprop=\"image\"], img"));
        var cover = img ? String(img.attr("data-src") || img.attr("src") || "").trim() : "";
        if (cover) cover = normalizeUrl(cover);
        var authorEl = safeFirst(e.select(".author"));
        var author = authorEl ? cleanText(authorEl.text()) : "";
        pushItem(name, a.attr("href"), cover, author);
    }

    // 2. .info-mobile-card (trang the loai / tim kiem) — BAT BUOC pham vi
    // trong cot chinh .col-truyen-main: sidebar .sidebar-right chua 30
    // the info-mobile-card giong het (bang hot ngay/tuan/thang, ~10 truyen
    // x 3 tab) — lay khong pham vi se tron truyen hot cua sidebar vao
    // danh sach va lam trang 2 trung 13/28 muc voi trang 1 (kiem chung
    // 2026-11-13). Danh sach chinh chi co 15 muc/trang.
    var infos = doc.select(".col-truyen-main .info-mobile-card");
    if (infos.size() === 0) infos = doc.select(".category-list-container .info-mobile-card");
    if (infos.size() === 0) infos = doc.select(".info-mobile-card");
    for (i = 0; i < infos.size(); i++) {
        var e2 = infos.get(i);
        var nameA = safeFirst(e2.select(".name a"));
        if (!nameA) continue;
        var name2 = cleanText(nameA.attr("title") || nameA.text());
        var img2 = safeFirst(e2.select(".info-image img, img"));
        var cover2 = img2 ? String(img2.attr("data-src") || img2.attr("src") || "").trim() : "";
        if (cover2) cover2 = normalizeUrl(cover2);
        var authorA = safeFirst(e2.select(".author a, .author"));
        var author2 = authorA ? cleanText(authorA.text()) : "";
        var chapA = safeFirst(e2.select(".info-latest-chapter a"));
        var desc2 = author2;
        if (chapA) {
            var chapText = cleanText(chapA.text());
            if (chapText) desc2 = desc2 ? (desc2 + " • " + chapText) : chapText;
        }
        pushItem(name2, nameA.attr("href"), cover2, desc2);
    }

    // 3. Fallback .list-truyen .row / .col-truyen-main .row
    var rows = doc.select(".list-truyen .row, .list-new .row, .col-truyen-main .row");
    for (i = 0; i < rows.size(); i++) {
        var e3 = rows.get(i);
        var a3 = safeFirst(e3.select(".home-new-comic-title a, .col-title a, a[itemprop=\"url\"]"));
        if (!a3) continue;
        var name3 = cleanText(a3.attr("title") || a3.text());
        var chapEl = safeFirst(e3.select(".col-chap a, .chapter-text"));
        var chapText3 = chapEl ? cleanText(chapEl.text()) : "";
        var timeEl = safeFirst(e3.select(".col-time"));
        var timeText = timeEl ? cleanText(timeEl.text()) : "";
        var desc3 = chapText3;
        if (timeText) desc3 = desc3 ? (desc3 + " • " + timeText) : timeText;
        pushItem(name3, a3.attr("href"), "", desc3);
    }

    return items;
}
