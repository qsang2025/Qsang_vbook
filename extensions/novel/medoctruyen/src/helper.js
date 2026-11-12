// helper.js — Ham dung chung cho Me Doc Truyen (medoctruyen.vn).
//
// Site Next.js App Router, HTML tinh phia server (kiem chung live 2026-11-12):
// - Danh sach truyen: the a.group (trang /browse?... va /bang-xep-hang/...),
//   10 truyen/trang; anh bia qua /_next/image?url=<CDN da ma hoa> (giai ma
//   thanh URL CDN truc tiep); tieu de o img alt; tac gia o span tac gia;
//   mo ta o p.line-clamp-2.
// - Phan trang: link "Tiep→" trong nav phan trang (href mang du tham so
//   audience/genre/q cua site, nen dung nguyen href do lam token trang sau).
// - Chi tiet: JSON-LD Book (ten, tac gia, bia, mo ta); trang thai o span
//   "Dang ra"/"Hoan thanh"; the loai o a.genre-chip; muc luc o
//   section#danh-sach-chuong, 24 chuong/trang, phan trang ?ch=N.
// - Chuong: doan van o p[data-line]; khi chua dang nhap chi co ban xem
//   truoc 3-9 doan + div[data-preview-gate] nhac dang nhap.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Gui kem header Cookie khi nguoi dung da dan cookie phien vao config
// COOKIE (xem file config.js). Tra ve { doc: Document } khi thanh cong,
// hoac { error: "tieng Viet" }.
function fetchMdDoc(url) {
    var opts = {};
    var ch = cookieHeaders();
    if (ch) opts.headers = ch;
    var res = null;
    try {
        res = pacedFetch(url, opts);
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Mê Đọc Truyện", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Mê Đọc Truyện", pacedHostOf(url), res.cooldownRemainingMs) };
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

// Giai ma anh bia Next.js: /_next/image?url=<CDN da ma hoa>&w=... thanh
// URL CDN truc tiep. Tra "" neu khong co tham so url= (de goi fallback).
function decodeCover(raw) {
    var s = String(raw || "");
    if (!s) return "";
    var i = s.indexOf("url=");
    if (i < 0) return "";
    var enc = s.substring(i + 4);
    var amp = enc.indexOf("&");
    if (amp >= 0) enc = enc.substring(0, amp);
    try {
        var dec = decodeURIComponent(enc);
        if (dec) return dec;
    } catch (e) {
    }
    return "";
}

// Parser MOT the truyen a.group thanh doi tuong truyen
// { name, cover, link, description, tag, host } hoac null.
//   - Ten + link: img alt (du phong span tieu de), href cua the.
//   - Bia: img srcset/src (giai ma /_next/image ve CDN truc tiep).
//   - Mo ta: p.line-clamp-2.
//   - Tag: ten tac gia (span tac gia trong the).
function parseBookCard(card) {
    var href = card.attr("href") || "";
    if (!href) return null;
    var img = safeFirst(card.select("img"));
    var name = "";
    if (img !== null) name = cleanText(img.attr("alt"));
    if (!name) {
        var t = safeFirst(card.select("span.line-clamp-2"));
        if (t !== null) name = cleanText(t.text());
    }
    if (!name) return null;

    var cover = "";
    if (img !== null) {
        cover = decodeCover(img.attr("srcset") || "") || decodeCover(img.attr("src") || "");
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var description = "";
    var descEl = safeFirst(card.select("p.line-clamp-2"));
    if (descEl !== null) description = cleanText(descEl.text());

    var tag = "";
    var authorEl = safeFirst(card.select("span.truncate.text-text-link"));
    if (authorEl !== null) tag = cleanText(authorEl.text());

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: description,
        tag: tag,
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho gen.js / search.js).
// Tra ve mang truyen (dedupe theo link).
function parseBookList(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select("a.group");
    cards.forEach(function (card) {
        var item = parseBookCard(card);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang danh sach ("") = het. Site dung link "Tiep→"
// trong nav phan trang; href cua no mang du tham so cua site (audience /
// genre / q) nen tra nguyen href tuyet doi lam token trang sau.
function nextPageUrl(doc) {
    var nextUrl = "";
    doc.select("a[href*=\"page=\"]").forEach(function (el) {
        if (cleanText(el.text()) === "Tiếp→") {
            nextUrl = el.attr("href") || "";
        }
    });
    nextUrl = cleanText(nextUrl);
    if (!nextUrl || nextUrl === "#") return "";
    if (nextUrl.indexOf("http") === 0) return nextUrl;
    return absUrl(nextUrl);
}

// Gan / doi tham so page=N tren mot URL danh sach (dung cho token trang
// dang so "2" khi test tay; token URL day du duoc uu tien hon).
function withPageParam(url, pageNum) {
    var n = parseInt(pageNum, 10);
    if (isNaN(n) || n < 1) return url;
    if (/([?&])page=\d+/.test(url)) return url.replace(/([?&])page=\d+/, "$1page=" + n);
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + n;
}
