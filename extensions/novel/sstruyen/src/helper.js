// helper.js — Ham dung chung cho SS Truyen (sstruyen.net).
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
// Site sstruyen.net (kiem chung live 2026-11-10): HTML tinh, khong
// Cloudflare; danh sach dung `article.archive-story-card` (20/trang);
// phan trang danh sach dang `/page/N` (khong phai `?page=N`);
// muc luc phan trang `/truyen/<slug>/page/N` (20 chuong/trang).

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
// Caller dung:
//     var r = fetchSsDoc(url);
//     if (r.error) return Response.error(r.error);
//     var doc = r.doc;
function fetchSsDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("SSTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("SSTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
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

// Parser MOT card truyen `article.archive-story-card` thanh doi tuong
// truyen { name, cover, link, description, tag, host } hoac null.
function parseStoryCard(el) {
    var titleA = el.select("h2.archive-story-card__title a").first();
    var link = "";
    var name = "";
    if (titleA !== null) {
        link = absUrl(titleA.attr("href"));
        name = cleanText(titleA.text());
    }
    if (!link) {
        var anyA = el.select("a[href*='/truyen/']").first();
        if (anyA !== null) link = absUrl(anyA.attr("href"));
    }
    if (!link) return null;
    if (!name) {
        var img0 = el.select("img").first();
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var img = el.select("a.archive-story-card__cover img").first();
    if (img === null) img = el.select("img").first();
    var cover = "";
    if (img !== null) {
        cover = img.attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var genres = [];
    el.select("a[itemprop=genre]").forEach(function (g) {
        var t = cleanText(g.text());
        if (t) genres.push(t);
    });
    var latestA = el.select(".archive-story-card__chapter a").first();
    var latest = latestA !== null ? cleanText(latestA.text()) : "";
    var statusEl = el.select(".archive-story-card__status").first();
    var status = statusEl !== null ? cleanText(statusEl.text()) : "";
    var descParts = [];
    if (genres.length > 0) descParts.push("Thể loại: " + genres.join(", "));
    if (latest) descParts.push(latest);
    if (status) descParts.push(status);

    return {
        name: name,
        cover: cover,
        link: link,
        description: descParts.join(" • "),
        tag: status,
        host: siteOrigin()
    };
}

// Parser ca danh sach card tren 1 trang: tra ve mang truyen (dedupe theo link).
function parseStoryList(doc) {
    var items = [];
    var seen = {};
    doc.select("article.archive-story-card").forEach(function (el) {
        var item = parseStoryCard(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang N cua mot trang danh sach (site dung `/page/N` chen truoc query).
// Trang 1 tra ve URL goc khong doi.
function ssPagedUrl(url, page) {
    var p = 1;
    try { p = parseInt(page, 10); } catch (e) { p = 1; }
    if (isNaN(p) || p <= 1) return url;
    var q = url.indexOf("?");
    var base = q === -1 ? url : url.substring(0, q);
    var query = q === -1 ? "" : url.substring(q);
    base = base.replace(/\/page\/\d+\/?$/, "").replace(/\/+$/, "");
    return base + "/page/" + p + query;
}

// So trang ke tiep ("") = het. Doc pager `nav.archive-pagination`:
// so trang lon nhat tu cac link `/page/N`, so trang hien tai tu `li.active`.
function ssNextPage(doc) {
    var maxPage = 1;
    var current = 1;
    var links = doc.select("nav.archive-pagination ul.pagination li a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/\/page\/(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > maxPage) maxPage = n;
        }
    }
    var active = doc.select("nav.archive-pagination ul.pagination li.active a").first();
    if (active !== null) {
        var c = parseInt(cleanText(active.text()), 10);
        if (!isNaN(c) && c >= 1) current = c;
    }
    if (current < maxPage) return String(current + 1);
    return "";
}

// Tong so chuong cua mot truyen, doc tu trang chi tiet:
// (a) meta description "…tổng số 295 chương…"; (b) du phong: so chuong lon
// nhat trong cac link `/chuong-N` tren trang (truyen danh so tuan tu tu 1).
// Tra ve so nguyen > 0, hoac 0 neu khong doc duoc.
function totalChaptersFromDetail(doc) {
    var meta = doc.select("meta[name=description]").first();
    if (meta !== null) {
        var desc = meta.attr("content") || "";
        var m = desc.match(/tổng số\s*(\d+)\s*chương/);
        if (m) {
            var total = parseInt(m[1], 10);
            if (!isNaN(total) && total > 0) return total;
        }
    }
    var maxCh = 0;
    doc.select("a[href*='/chuong-']").forEach(function (a) {
        var href = a.attr("href") || "";
        var m2 = href.match(/\/chuong-(\d+)/);
        if (m2) {
            var n = parseInt(m2[1], 10);
            if (!isNaN(n) && n > maxCh) maxCh = n;
        }
    });
    return maxCh;
}

// Danh sach URL cac trang muc luc cua 1 truyen (20 chuong/trang).
// Trang 1 la URL goc; cac trang sau la `<url>/page/N`.
function tocPageUrls(detailUrl, total) {
    var pages = [detailUrl];
    if (!total || total <= 20) return pages;
    var count = Math.ceil(total / 20);
    var i = 0;
    for (i = 2; i <= count; i++) {
        pages.push(detailUrl.replace(/\/+$/, "") + "/page/" + i);
    }
    return pages;
}
