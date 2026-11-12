// helper.js — Ham dung chung cho AkayTruyen (akaytruyen.com).
//
// Site Laravel SSR, HTML tinh phia server (kiem chung live 2026-11-13):
// - Danh sach truyen: the `.story-item` (luoi, trang chu + the loai,
//   16 truyen/trang the loai) va `.story-item-list` (danh sach, trang tim
//   kiem); anh bia qua /storage/media-variants/<hash>/cover-list-*.webp
//   (img src = ban desktop, source srcset = ban mobile); ten o
//   h3.story-item__name / h3.story-item-list__name; tac gia o
//   .author-name; chuong moi nhat o a.story-item-list__chapter.
// - Chi tiet: /truyen/<slug>; tac gia / trang thai / the loai o
//   .story-detail__bottom--info; mo ta o .story-detail__top--desc;
//   bia o .story-detail__top--image img.
// - Muc luc: 50 chuong/trang, mac dinh moi nhat truoc; ?old_first=1 doi
//   sang cu nhat truoc; phan trang ?old_first=1&page=N, so trang lon nhat
//   o #main-chapter-pagination (data-url) hoac input.input-paginate[max].
// - Chuong: 3 dang URL — /<slug>/chuong-<N>-<ten>, /<slug>/<N>-chuong-<N>-<ten>
//   VA /<slug>/<N>-<ten> (vd /con-duong-ba-chu/10-bach-nguyet...); co ca chuong
//   dac biet khong co so trong URL (vd .../nhan-cach-dang-tran-trong) — so chuong
//   chuan lay tu thuoc tinh data-chapter cua the chuong; noi dung o
//   div#chapter-content, cac the <p> sach, KHONG can dang nhap, doc du (kiem
//   chung ch.1 cua ca 2 truyen mau: 58 va 184 doan, dung noi dung goc).
// - Tim kiem: GET /tim-kiem?key_word=<tu khoa> — CHI tra ket qua khi go
//   CO DAU (vd "con duong" tra 0, "con duong" co dau tra 1); ket qua dung
//   the .story-item-list. Trang the loai KHONG phan trang (?page=2 tra
//   giong het trang 1) nen gen.js luon tra data2 = "".
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
function fetchAkDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("AkayTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("AkayTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
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

// Slug truyen tu URL dang /truyen/<slug> (bo query/hash va "/" cuoi).
function storySlugFromUrl(url) {
    var s = String(url || "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    var m = s.match(/\/truyen\/([a-z0-9-]+)$/i);
    if (m) return m[1].toLowerCase();
    return "";
}

// Link truyen hop le: dang /truyen/<slug>, KHONG phai link chuong
// (/<slug>/chuong-... hay /<slug>/<N>-chuong-...) va khong phai link khac.
function isStoryLink(href) {
    if (!href) return false;
    var s = String(href).replace(/[?#].*$/, "").replace(/\/+$/, "");
    if (s.indexOf("/chuong-") !== -1) return false;
    if (/\/\d+-chuong-/i.test(s)) return false;
    return /\/truyen\/[a-z0-9-]+$/i.test(s);
}

// So chuong tu URL chuong, ca 3 dang:
// /<slug>/chuong-<N>-..., /<slug>/<N>-chuong-<N>-... va
// /<slug>/<N>-<ten>... (vd /con-duong-ba-chu/10-bach-nguyet...);
// rieng chuong dac biet /<slug>/<ten> (vd .../nhan-cach-dang-tran-trong)
// khong co so trong URL — truong hop do toc.js lay so tu data-chapter.
function chapterNumberFromUrl(url) {
    var s = String(url || "");
    var m = s.match(/\/chuong-(\d+)(?:-|$)/i);
    if (m) return parseInt(m[1], 10);
    m = s.match(/\/(\d+)-chuong-(\d+)(?:-|$)/i);
    if (m) return parseInt(m[2], 10);
    m = s.match(/\/(\d+)-[^\/]*$/);
    if (m) return parseInt(m[1], 10);
    return 0;
}

// Ten chuong chuan: "Chương <N>" + (" - " + tieu de neu co).
function chapterDisplayName(num, title) {
    var t = cleanText(title || "");
    if (num > 0 && t) return "Chương " + num + " - " + t;
    if (num > 0) return "Chương " + num;
    return t || "Chương";
}

// Parse 1 the truyen (luoi .story-item hoac danh sach .story-item-list)
// thanh doi tuong { name, cover, link, description, host } hoac null.
function parseStoryCard(card) {
    var link = "";
    var anchors = card.select("a[href]");
    var i = 0;
    for (i = 0; i < anchors.size(); i++) {
        var href = anchors.get(i).attr("href") || "";
        if (isStoryLink(href)) {
            link = absUrl(href);
            break;
        }
    }
    if (!link) return null;

    var name = "";
    var nameEl = safeFirst(card.select(".story-item__name, .story-item-list__name"));
    if (nameEl !== null) name = cleanText(nameEl.text());
    if (!name) {
        var img0 = safeFirst(card.select("img"));
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var cover = "";
    var img = safeFirst(card.select("img"));
    if (img !== null) cover = img.attr("src") || img.attr("data-src") || "";

    var parts = [];
    var authorEl = safeFirst(card.select(".author-name"));
    if (authorEl !== null) {
        var author = cleanText(authorEl.text());
        if (author) parts.push(author);
    }
    var latestEl = safeFirst(card.select(".story-item-list__chapter"));
    if (latestEl !== null) {
        var latest = cleanText(latestEl.text());
        if (latest) parts.push(latest);
    }
    if (parts.length === 0) {
        card.select(".story-item__badge").forEach(function (b) {
            var t = cleanText(b.text());
            if (t) parts.push(t);
        });
    }

    return {
        name: name,
        cover: cover ? absUrl(cover) : "",
        link: link,
        description: parts.join(" • "),
        host: siteOrigin()
    };
}

// Parse toan bo the truyen tren 1 trang danh sach, dedupe theo link.
function parseStoryCards(doc) {
    var list = [];
    var seen = {};
    if (!doc) return list;
    doc.select(".story-item, .story-item-list").forEach(function (card) {
        var item = parseStoryCard(card);
        if (!item) return;
        var key = item.link.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        list.push(item);
    });
    return list;
}
