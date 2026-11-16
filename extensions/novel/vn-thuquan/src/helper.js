// helper.js — Parser dung chung cho vnthuquan.org.
//
// Bo cuc danh sach (kiem chung live 2026-11-16, ca UA mobile):
// div.list.list-truyen > div.row (20 sach/trang) — moi row:
//   div.col-xs-3 > a[href^="/TacPham/"] > img (bia, src tuong doi)
//   div.col-xs-7:
//     span.label-time (ngay dang hoac luot doc)
//     div.truyen-title[itemprop=name] > span.viethoachu > a (ten sach)
//     span.author[itemprop=author] > a[href^="/Truyen/TacGia/"] (tac gia)
//     a[href*="theloai"] (the loai, vd. "Lịch sử, Dã sử")
//     .totalchuong ("40 Chương" hoac "1 Quyển")
//     span.vntq-app-solan ("· 8508 lượt xem")
// Bo cuc nay DUNG CHUNG cho trang danh sach (/Truyen/moinhat/,
// /Truyen/luotxem/, /Truyen/danhgia/, /Truyen/Theloai/<Ten>/),
// trang ket qua tim kiem (/Truyen/TimKiem/<tu-khoa>/) va trang tac gia.
// Phan trang: chu "Trang N / M" trong div.img-ebook (vd. "Trang 1 / 1601");
// URL trang sau dang /Trang-<n> noi vao cuoi URL goc (bo /Trang-<cu> neu co).
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Parser MOT dong truyen trong danh sach (div.row). Ten lay tu
// div.truyen-title a (fallback: alt cua img bia); link lay tu cung a do
// (fallback: a dau tien tro toi /TacPham/); bia lay tu img trong col-xs-3
// (bo qua defaultcover.jpg); mo ta = tac gia + the loai + so chuong/quyen
// + luot xem. Bo qua dong khong co ten hoac trung link.
function parseBookRow(row, seen) {
    var titleA = safeFirst(row.select("div.truyen-title a"));
    if (titleA === null) titleA = safeFirst(row.select("a[href^=\"/TacPham/\"]"));
    if (titleA === null) return null;
    var href = String(titleA.attr("href") || "");
    var id = bookId(href);
    if (!id) return null;
    var slugId = bookSlugId(href);
    if (!slugId) return null;
    var link = BASE_URL + "/TacPham/" + slugId + "/";
    if (seen[link]) return null;

    var name = cleanText(titleA.text());
    if (!name) {
        var im0 = safeFirst(row.select("img"));
        if (im0 !== null) name = cleanText(im0.attr("alt") || "");
    }
    if (!name) return null;
    seen[link] = 1;

    var cover = "";
    var im = safeFirst(row.select("div.col-xs-3 img"));
    if (im === null) im = safeFirst(row.select("img"));
    if (im !== null) {
        cover = String(im.attr("src") || "");
        if (cover.indexOf("defaultcover") !== -1) cover = "";
        if (cover && cover.indexOf("http") !== 0) cover = normalizeVntqUrl(cover);
    }

    var descParts = [];
    var au = safeFirst(row.select("span.author a"));
    if (au !== null) {
        var a = cleanText(au.text());
        if (a) descParts.push(a);
    }
    var ge = safeFirst(row.select("a[href*=\"theloai\"]"));
    if (ge === null) ge = safeFirst(row.select("a[href*=\"Theloai\"]"));
    if (ge !== null) {
        var g = cleanText(ge.text());
        if (g) descParts.push(g);
    }
    var tc = safeFirst(row.select(".totalchuong"));
    if (tc !== null) {
        var t = cleanText(tc.text());
        if (t) descParts.push(t);
    }
    var vw = safeFirst(row.select("span.vntq-app-solan"));
    if (vw !== null) {
        var v = cleanText(vw.text());
        if (v) descParts.push(v);
    }

    return {
        name: name,
        cover: cover,
        link: link,
        description: descParts.join(" | ")
    };
}

// Parser toan bo danh sach div.list.list-truyen tren 1 trang.
function parseListItems(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("div.list.list-truyen > div.row");
    for (var i = 0; i < rows.size(); i++) {
        var one = parseBookRow(rows.get(i), seen);
        if (one !== null) items.push(one);
    }
    return items;
}

// So trang ke tiep (dang chuoi so trang, "" khi het). Doc tu chu
// "Trang N / M" trong div.img-ebook: con trang sau khi N < M.
// Fallback: so trang lon nhat trong cac link /Trang-<n> tren trang.
function nextPageToken(doc) {
    var bodyText = "";
    try { bodyText = String(doc.select("body").text() || ""); } catch (e) { bodyText = ""; }
    var m = bodyText.match(/Trang\s+(\d+)\s*\/\s*(\d+)/);
    if (m) {
        var cur = parseInt(m[1], 10);
        var tot = parseInt(m[2], 10);
        if (!isNaN(cur) && !isNaN(tot)) {
            if (cur < tot) return String(cur + 1);
            return "";
        }
    }
    var best = 0;
    var cur2 = 1;
    var links = doc.select("a[href*=\"/Trang-\"]");
    for (var i = 0; i < links.size(); i++) {
        var h = String(links.get(i).attr("href") || "");
        var mm = h.match(/\/Trang-(\d+)/);
        if (mm) {
            var n = parseInt(mm[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    if (m) cur2 = parseInt(m[1], 10);
    if (best > cur2) return String(cur2 + 1);
    return "";
}

// URL trang danh sach o so trang pn: bo /Trang-<cu> o cuoi URL goc roi
// noi /Trang-<pn> (trang 1 tra URL goc, khong noi them).
function listPageUrl(base, pn) {
    var b = String(base || "").replace(/\/Trang-\d+\/?$/, "");
    if (!pn || pn <= 1) return b;
    return b + "/Trang-" + pn;
}

// So trang hien tai trong URL danh sach: /Trang-<n> -> n; khong co -> 1.
function currentPageNum(url) {
    var m = String(url).match(/\/Trang-(\d+)/);
    if (m) return parseInt(m[1], 10);
    return 1;
}
