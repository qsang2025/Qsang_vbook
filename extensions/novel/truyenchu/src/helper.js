// helper.js — Ham dung chung cho TruyenChu (truyenchu.net).
//
// Site VN, WordPress (theme Madara WP-Manga), SSR day du cho danh sach /
// chi tiet / chuong (khong can giai ma, khong can WebView). Port tu
// MeoU truyenchu v9 (fork tren dia) — base dung duoc phan lon: site van
// la Madara nhu base mo ta (selector .page-item-detail, .post-title,
// .summary_image, .author-content, .genres-content, .post-status,
// .manga-excerpt, .reading-content .text-left deu con song, kiem chung
// tu VM 2026-11-13). NHUNG toc.js cua base hong 1 cho: POST ve
// {storyUrl}ajax/chapters/ KHONG co body thi site tra 400 (POST khong
// body con treo toi 25s+); phai gui body manga=<id> (id lay tu
// #manga-chapters-holder[data-id] tren trang chi tiet — gia tri id
// thuc ra khong quan trong, site tra chuong theo slug trong URL, kiem
// chung: gui sai id van tra dung 1992 chuong cua Muc Than Ky).
// - Danh sach: the truyen .page-item-detail (22 muc/trang) tren archive
//   the loai (/the-loai/<slug>/), trang tong /truyen/, tac gia
//   (/tac-gia/<slug>/) va ket qua tim kiem (/?s=<tu khoa>&post_type=
//   wp-manga). Phan trang /page/N/ qua a.next.page-numbers (tim kiem:
//   /page/N/?s=<tu khoa>&post_type=wp-manga).
// - The loai: 34 the loai trong .genres_wrap .genres cua trang chu
//   (kiem chung 2026-11-13); fallback cung neu fetch that bai.
// - Chi tiet: /truyen/<slug>/ — h1 (khong class), anh bia
//   .summary_image img (og:image la logo site, KHONG dung), tac gia
//   .author-content a, the loai .genres-content a, trang thai
//   .post-status .summary-content (Completed), mo ta .manga-excerpt.
// - Muc luc: POST ve {storyUrl}ajax/chapters/, body manga=<id>, tra
//   HTML fragment day du 1 lan (khong phan trang): 2141 chuong Quang Am
//   Chi Ngoai, 1992 chuong Muc Than Ky, moi nhat truoc — dao nguoc ve
//   chuong 1 truoc khi tra. Khong co page.js (TOC khong phan trang).
// - Chuong: /truyen/<slug>/chuong-N/ — noi dung day du trong
//   .reading-content .text-left (QAN ch.1: 3 doan, 9474 ky tu, mo dau
//   "Thang ba, dau mua xuan. Mot goc Dong Bo, Nam Hoang chau...";
//   MTK ch.1: 1 doan, 13210 ky tu, mo dau "Troi toi, dung ra ngoai.";
//   khong quang cao, khong can dang nhap, khong preview, khong khoa —
//   kiem chung tu VM 2026-11-13). Doan cuoi chuong co the la boilerplate
//   "Copyright to Truyen Chu. Website dang trong qua trinh thu nghiem"
//   (gap o QAN ch.2141) — chap.js loc bo.
// - Chuong VIP hien khong co tren site (0 marker vip/lock trong TOC
//   2141 chuong, kiem chung 2026-11-13) — toc.js van danh dau pay/lock
//   + tien to "[VIP] " neu gap marker, chap.js van phong thu: gap dau
//   hieu khoa/mua thi bao loi tieng Viet, khong mo khoa.
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
function fetchTruyenchuPage(url, options) {
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
        return { error: rateLimitErrorMessage("TruyenChu", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("TruyenChu", pacedHostOf(url), r.cooldownRemainingMs) };
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
        return { error: "Trang đang yêu cầu xác minh Cloudflare — hãy mở truyenchu.net trong trình duyệt của app một lần rồi thử lại." };
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
// The truyen: .page-item-detail > .item-thumb img (anh bia) +
// .post-title h3 a (ten) + .list-chapter .chapter-item a (chuong moi
// nhat, lam mo ta). 22 muc/trang tren moi archive va ket qua tim kiem.
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

    var cards = doc.select(".page-item-detail");
    for (var i = 0; i < cards.size(); i++) {
        var e = cards.get(i);
        var titleA = safeFirst(e.select(".post-title a"));
        if (!titleA) titleA = safeFirst(e.select("h3 a"));
        if (!titleA) titleA = safeFirst(e.select(".item-thumb a"));
        if (!titleA) continue;
        var href = String(titleA.attr("href") || "").trim();
        if (!href) continue;
        var name = cleanText(titleA.text());
        if (!name) {
            name = cleanText(titleA.attr("title"));
        }
        if (!name) continue;
        var img = safeFirst(e.select(".item-thumb img"));
        var cover = "";
        if (img) {
            var src = String(img.attr("src") || "").trim();
            if (src) cover = normalizeUrl(src);
        }
        var chapEl = safeFirst(e.select(".list-chapter .chapter-item a"));
        var desc = chapEl ? cleanText(chapEl.text()) : "";
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

// --- Trich manga id tu trang chi tiet ---------------------------------------
// Dang that trong HTML (kiem chung 2026-11-13):
//   <div id="manga-chapters-holder" data-id="346915">
//   var manga = {"ajax_url":"...","base_url":"...","manga_id":"346915"}
// Tra id dang chuoi hoac "".
function extractMangaId(doc, raw) {
    var holder = safeFirst(doc.select("#manga-chapters-holder"));
    if (holder) {
        var id = String(holder.attr("data-id") || "").trim();
        if (id) return id;
    }
    var m = String(raw || "").match(/"manga_id"\s*:\s*"(\d+)"/);
    if (m) return m[1];
    return "";
}

// --- Goi AJAX muc luc cua Madara --------------------------------------------
// POST ve {storyUrl}ajax/chapters/, body manga=<id> (can Referer la trang
// chi tiet). POST khong body tra 400, POST khong Content-Length treo
// (kiem chung tu VM 2026-11-13). Tra ve HTML fragment day du 1 lan
// (khong phan trang), chuong moi nhat truoc. Tra {items} hoac {error}.
function fetchTocAjax(detailUrl, mangaId) {
    var ajaxUrl = detailUrl.replace(/\/?$/, "/") + "ajax/chapters/";
    var body = "manga=" + encodeURIComponent(mangaId || "0");
    var res = null;
    try {
        res = pacedFetch(ajaxUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "text/html, */*; q=0.01",
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
        return { error: rateLimitErrorMessage("TruyenChu", pacedHostOf(detailUrl), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("TruyenChu", pacedHostOf(detailUrl), res.cooldownRemainingMs) };
        }
        return { error: "Không tải được mục lục (HTTP " + st + ")." };
    }
    var text = "";
    try {
        text = String(res.res.text());
    } catch (e2) {
        return { error: "Không đọc được mục lục." };
    }
    if (!text) return { error: "Không đọc được mục lục (site trả về rỗng)." };
    var frag = null;
    try {
        frag = Html.parse(text);
    } catch (e3) {
        frag = null;
    }
    if (!frag) return { error: "Không đọc được mục lục." };
    var links = frag.select(".wp-manga-chapter a[href]");
    if (links.size() === 0) links = frag.select(".listing-chapters_wrap a[href*='/chuong']");
    if (links.size() === 0) links = frag.select("a[href*='/chuong']");
    var items = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "").trim();
        var name = cleanText(a.text());
        if (!href || !name) continue;
        if (href.indexOf("/chuong") === -1) continue;
        var full = normalizeUrl(href);
        if (seen[full]) continue;
        seen[full] = true;
        var liHtml = "";
        try {
            var li = a.parent();
            if (li) liHtml = String(li.html() || "").toLowerCase();
        } catch (e4) {
        }
        var locked = liHtml.indexOf("vip") !== -1 ||
            liHtml.indexOf("crown") !== -1 ||
            liHtml.indexOf("fa-lock") !== -1 ||
            liHtml.indexOf("lock") !== -1;
        var entry = {
            name: locked ? "[VIP] " + name : name,
            url: full,
            host: BASE_URL
        };
        if (locked) {
            entry.pay = true;
            entry.lock = true;
        }
        items.push(entry);
    }
    // Site tra chuong moi nhat truoc — dao nguoc ve chuong 1 truoc.
    var reversed = [];
    for (var j = items.length - 1; j >= 0; j--) {
        reversed.push(items[j]);
    }
    return { items: reversed };
}
