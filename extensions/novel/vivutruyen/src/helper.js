// helper.js — Ham dung chung cho VivuTruyen (vivutruyen.net).
//
// Site VN, WordPress, SSR day du cho danh sach / chi tiet / chuong
// (khong can giai ma, khong can WebView). Port tu kychi vivutruyen v1
// (fork tren dia) — base dung duoc phan lon, nhung sua nhieu cho:
// - config.js kieu base dung CONFIG_URL / CONFIG_UA (khong dung chuan
//   nha) va hard-code UA mobile — site tra 200 ca khi khong co UA nen
//   bo UA, dung pacedFetch khong UA (quy tac 10).
// - gen.js / search.js kieu base dung .first() roi kiem tra truthy
//   (runtime .first() khong bao gio tra null — xem FIRST-QUIRK-AUDIT.md)
//   va dung .parent() (runtime khong co ham nay) — viet lai bang
//   safeFirst() va selector co pham vi hep.
// - detail.js kieu base tra truong link / status / category (khong dung
//   hop dong hien tai) — viet lai theo hop dong: url / type / format.
// - chap.js kieu base tra chuoi tieng Viet lam noi dung khi rong —
//   viet lai: tra Response.error tieng Viet, co nhanh VIP/login.
// - toc.js kieu base chon a[href*="/chuong-"] rong (dinh ca nut
//   "Bat Dau Doc" id first_chap) — thu hep ve div.list a.chap-title.
// - page.js cua base tra [detailUrl] lam trang muc luc — TOC day du
//   1 lan tren trang chi tiet nen BO page.js (khong khai bao trong
//   plugin.json).
//
// Co che site (kiem chung tu VM 2026-11-14):
// - Danh sach: the truyen .uk-cover-container (anh bia img[data-src],
//   tieu de h3.de-cu-title, trang thai span.tien-to, link
//   a.uk-position-cover); 28 muc/trang o archive the loai, 24 muc/trang
//   o ket qua tim kiem; phan trang /page/N/ qua a.next.page-numbers
//   (kiem chung: ngon-tinh p1 28 muc, p2 28 muc khac, 0 trung).
// - The loai: 54 muc trong ul.danh-muc a.menu-item cua trang chu
//   (href dang /<slug> khong co slash cuoi); fallback cung neu fetch
//   that bai.
// - Tim kiem: GET /?s=<tu khoa> (form mac dinh WordPress, go co dau
//   duoc, khong dau cung tra ket qua); phan trang /page/N/?s=<tu khoa>.
// - Chi tiet: /<slug>/ — h1 a.title-truyen, anh bia .image-truyen img
//   (data-src, lazy), ul.info-truyen li (Tac gia / The Loai / Trang
//   Thai), mo ta .noi-dung.
// - Muc luc: day du 1 lan tren trang chi tiet trong div.list
//   (ul.uk-switcher), a.chap-title, moi nhat truoc — dao nguoc ve
//   chuong 1 truoc. So chuong tren site la that: truyen co chuong
//   6-17 (chuong 1-5 tra 404, khong ton tai — khong phai thieu).
// - Chuong: /<slug>/chuong-N[-<slug>] (301 ve dang co slash cuoi) —
//   noi dung day du trong div.uk-width-1-1.reading (kiem chung:
//   ch.1 103 doan, mo dau "Chu Tu Triet ban chuyen gi vay?...";
//   ch.7 164 doan; ch.17 truyen khac 42 doan). Doan dau co the la
//   "<p>1</p>" / "<p>17</p>" (so chuong roi) — chap.js loc bo.
// - Chuong VIP hien khong co tren site (0 marker vip/lock trong TOC,
//   kiem chung 2026-11-14) — toc.js van danh dau pay/lock + tien to
//   "[VIP] " neu gap marker, chap.js van phong thu: gap dau hieu
//   khoa/mua thi bao loi tieng Viet, khong mo khoa.
// - Dung safeFirst() thay cho kiem tra truthy cua .first().
// - Dung pacedFetch() cua lib rate-limit.js (default headers +
//   pacing + retry 429/405/503).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Fetch 1 trang: tra {doc, rawHtml} hoac {error} -----------------------
// Doc rawHtml truoc roi Html.parse (chi doc body 1 lan — tranh double-read
// lam .html() tra null).
function fetchVivuPage(url, options) {
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
        return { error: rateLimitErrorMessage("VivuTruyen", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("VivuTruyen", pacedHostOf(url), r.cooldownRemainingMs) };
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
        return { error: "Trang đang yêu cầu xác minh Cloudflare — hãy mở vivutruyen.net trong trình duyệt của app một lần rồi thử lại." };
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
// The truyen: .uk-cover-container > img[data-src] (anh bia) +
// h3.de-cu-title (ten, co the chua div.chap-title long ben trong) +
// span.tien-to (trang thai) + a.uk-position-cover (link). Loai bo link
// ve tac gia (/tac-gia/) va link chuong (/chuong-).
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

    var cards = doc.select(".uk-cover-container");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var linkEl = safeFirst(card.select("a.uk-position-cover"));
        if (!linkEl) continue;
        var link = String(linkEl.attr("href") || "").trim();
        if (!link) continue;
        if (link.indexOf("/tac-gia/") !== -1 || link.indexOf("/chuong-") !== -1) continue;
        if (normalizeUrl(link) === BASE_URL + "/") continue;

        var title = "";
        var titleEl = safeFirst(card.select(".de-cu-title"));
        if (titleEl) {
            titleEl.select(".chap-title").remove();
            title = cleanText(titleEl.text());
        }
        if (!title) continue;

        var cover = "";
        var imgEl = safeFirst(card.select("img"));
        if (imgEl) {
            cover = String(imgEl.attr("data-src") || imgEl.attr("src") || "").trim();
            if (cover) cover = normalizeUrl(cover);
        }

        var statusText = "";
        var statusEl = safeFirst(card.select(".tien-to"));
        if (statusEl) statusText = cleanText(statusEl.text());

        var chapText = "";
        var chapEl = safeFirst(card.select(".chap-title"));
        if (chapEl) chapText = cleanText(chapEl.text());

        var description = "";
        if (statusText && chapText) description = statusText + " - " + chapText;
        else if (statusText) description = statusText;
        else if (chapText) description = chapText;

        pushItem(title, link, cover, description);
    }
    return items;
}

// --- Phan trang danh sach ---------------------------------------------------
// Tra token trang ke (chuoi) neu con trang sau, "" neu het.
function detectNextPageToken(doc, page) {
    var hasNext = doc.select("a[rel=\"next\"]").size() > 0 ||
                  doc.select(".pagination a.next").size() > 0 ||
                  doc.select("a.next.page-numbers").size() > 0;
    if (!hasNext) return "";
    return String(parseInt(page, 10) + 1);
}

// --- URL trang archive theo so trang ----------------------------------------
// Trang 1: giu nguyen URL (site chap nhan ca co/khong slash cuoi).
// Trang N>1: bo slash cuoi roi them /page/N/.
function buildArchivePageUrl(url, page) {
    var base = String(url || "").replace(/\/+$/, "");
    if (!page || page === "1") return url;
    return base + "/page/" + page + "/";
}
