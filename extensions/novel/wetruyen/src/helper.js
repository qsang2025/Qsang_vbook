// helper.js — Ham dung chung cho Wetruyen (wetruyen.com).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day (load khong de quy). Script nao dung
// helper nay phai load truoc theo thu tu:
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file rate-limit.js;
//     file helper.js;
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
//
// Site wetruyen.com (kiem chung live 2026-11-11): HTML tinh, khong
// Cloudflare; danh sach dung `.row[itemtype=".../Book"]` (25/trang);
// bia trong `div.lazyimg` (data-desk-image / data-image, khong co <img>);
// phan trang danh sach dang `<base>trang-N/`, tim kiem dang `&paged=N`;
// muc luc phan trang `/<slug>.<id>/trang-N/` (50 chuong/trang).

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
// Caller dung:
//     var r = fetchWtDoc(url);
//     if (r.error) return Response.error(r.error);
//     var doc = r.doc;
function fetchWtDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Wetruyen", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Wetruyen", pacedHostOf(url), res.cooldownRemainingMs) };
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

// Bo ky tu BOM (U+FEFF) site chen truoc chu "Chương" trong mot so link.
function stripBom(s) {
    return String(s || "").replace(/\uFEFF/g, "");
}

// Parser MOT dong truyen `.row[itemtype=".../Book"]` thanh doi tuong
// truyen { name, cover, link, description, tag, host } hoac null.
//   - Ten + link: h3.truyen-title a.
//   - Bia: div.lazyimg (data-desk-image uu tien, data-image du phong).
//   - Tac gia: span.author[itemprop=author].
//   - So chuong: span.author thu hai ("3752 chương") lam tag.
function parseBookRow(row) {
    var titleEl = row.select("h3.truyen-title a").first();
    if (titleEl === null) return null;
    var href = titleEl.attr("href");
    var name = cleanText(titleEl.text()) || cleanText(titleEl.attr("title"));
    if (!href || !name) return null;

    var cover = "";
    var lazy = row.select("div.lazyimg").first();
    if (lazy !== null) {
        cover = lazy.attr("data-desk-image") || lazy.attr("data-image") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }
    if (!cover) {
        var img = row.select("img").first();
        if (img !== null) {
            cover = img.attr("src") || img.attr("data-src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
        }
    }

    var author = "";
    var authorEl = row.select("span.author[itemprop=author]").first();
    if (authorEl !== null) author = cleanText(authorEl.text());

    var tag = "";
    var spans = row.select("span.author");
    var si = 0;
    for (si = 0; si < spans.size(); si++) {
        var t = cleanText(spans.get(si).text());
        if (/chương/i.test(t)) { tag = t; break; }
    }
    if (!tag) {
        if (safeFirst(row.select("span.label-full")) !== null) tag = "Hoàn thành";
        else if (safeFirst(row.select("span.label-hot")) !== null) tag = "Hot";
    }

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: author,
        tag: tag,
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho home/genre/search).
// Tra ve mang truyen (dedupe theo link).
function parseBookList(doc) {
    var items = [];
    var seen = {};
    doc.select("div.row[itemtype=\"https://schema.org/Book\"]").forEach(function (row) {
        var item = parseBookRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang N cua mot trang danh sach.
//   - Tim kiem (/tim-kiem/): them/sua tham so `paged=N`.
//   - Danh sach thuong: chen `/trang-N/` vao cuoi path.
// Trang 1 tra ve URL goc khong doi.
function wtPagedUrl(url, page) {
    var p = 1;
    try { p = parseInt(page, 10); } catch (e) { p = 1; }
    if (isNaN(p) || p <= 1) return url;
    if (url.indexOf("/tim-kiem/") !== -1) {
        var cleaned = url.replace(/([?&])paged=\d+&?/, "$1").replace(/[?&]$/, "");
        var sep = cleaned.indexOf("?") === -1 ? "?" : "&";
        return cleaned + sep + "paged=" + p;
    }
    var base = url.replace(/\/trang-\d+\/?$/, "").replace(/\/+$/, "");
    return base + "/trang-" + p + "/";
}

// So trang ke tiep ("") = het. Doc pager `ul.pagination`: so trang lon
// nhat tu cac link `/trang-N/` (danh sach) hoac `paged=N` (tim kiem).
function wtNextPage(doc, currentPage) {
    var maxPage = 1;
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;
    doc.select("ul.pagination a").forEach(function (a) {
        var href = a.attr("href") || "";
        var m = href.match(/\/trang-(\d+)\//);
        if (!m) m = href.match(/[?&]paged=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > maxPage) maxPage = n;
        }
    });
    if (cur < maxPage) return String(cur + 1);
    return "";
}

// Tong so chuong cua mot truyen, doc tu trang chi tiet:
// (a) meta description "…số chương 311 tình trạng Đang ra.";
// (b) du phong: so chuong lon nhat trong khoi "chuong moi nhat".
// Tra ve so nguyen > 0, hoac 0 neu khong doc duoc.
function totalChaptersFromDetail(doc) {
    var meta = doc.select("meta[name=description]").first();
    if (meta !== null) {
        var desc = meta.attr("content") || "";
        var m = desc.match(/số chương\s*(\d+)/);
        if (m) {
            var total = parseInt(m[1], 10);
            if (!isNaN(total) && total > 0) return total;
        }
    }
    var maxCh = 0;
    doc.select(".l-chapters a[href*='/chuong-']").forEach(function (a) {
        var href = a.attr("href") || "";
        var m2 = href.match(/\/chuong-(\d+)\.html/);
        if (m2) {
            var n = parseInt(m2[1], 10);
            if (!isNaN(n) && n > maxCh) maxCh = n;
        }
    });
    return maxCh;
}

// Danh sach URL cac trang muc luc cua 1 truyen (50 chuong/trang).
// Trang 1 la URL chi tiet goc; cac trang sau la `<url>/trang-N/`.
function tocPageUrls(detailUrl, total) {
    var pages = [detailUrl];
    if (!total || total <= 50) return pages;
    var count = Math.ceil(total / 50);
    var i = 0;
    for (i = 2; i <= count; i++) {
        pages.push(detailUrl.replace(/\/+$/, "") + "/trang-" + i + "/");
    }
    return pages;
}
