// helper.js — Ham dung chung cho Metruyenchu.org (metruyenchu.org).
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
// Site metruyenchu.org (kiem chung live 2026-11-11): Laravel, HTML tinh,
// khong Cloudflare; kho nho (~7 truyen, 2026-11-11); danh sach dung
// `article.category-story-card` trong `#categoryStoriesGrid` (hot) hoac
// `.category-stories-grid` (the loai); phan trang bang nut
// `#loadMoreStories` + `data-next-url` (hien tai rong tren moi trang mau
// — chi co 1 trang); tim kiem qua API `/story/search?type=quick_search`;
// muc luc SSR day du trong `#mt-chapters-list`, khong phan trang;
// chuong trong `<div id="chapter-c">`.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
// Caller dung:
//     var r = fetchMtcDoc(url);
//     if (r.error) return Response.error(r.error);
//     var doc = r.doc;
function fetchMtcDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Metruyenchu.org", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Metruyenchu.org", pacedHostOf(url), res.cooldownRemainingMs) };
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

// Fetch 1 API JSON co pacing (tim kiem quick_search).
// Tra ve { text: <body> } khi HTTP 2xx, hoac { error: "tieng Viet" }.
function fetchMtcText(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được dữ liệu: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Metruyenchu.org", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Metruyenchu.org", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var text = "";
    try {
        text = res.res.text();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    return { text: text };
}

// Parser MOT dong truyen `article.category-story-card` thanh doi tuong
// truyen { name, cover, link, description, tag, host } hoac null.
//   - Ten + link: a.category-story-title.
//   - Bia: .category-story-cover img[src].
//   - Mo ta: chuong moi nhat (.category-story-chapter a).
//   - Tag: luot xem (span dau trong .category-story-stats) + " lượt xem".
function parseBookRow(row) {
    var titleEl = row.select("a.category-story-title").first();
    if (titleEl === null) return null;
    var href = titleEl.attr("href");
    var name = cleanText(titleEl.text()) || cleanText(titleEl.attr("title"));
    if (!href || !name) return null;

    var cover = "";
    var img = row.select(".category-story-cover img").first();
    if (img !== null) {
        cover = img.attr("src") || img.attr("data-src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var description = "";
    var chapEl = row.select(".category-story-chapter a").first();
    if (chapEl !== null) description = cleanText(chapEl.text());

    var tag = "";
    var stats = row.select(".category-story-stats span");
    if (stats.size() >= 1) {
        var views = cleanText(stats.get(0).text());
        if (views) tag = views + " lượt xem";
    }

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: description,
        tag: tag,
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho home/genre/search-duyet).
// Tra ve mang truyen (dedupe theo link).
function parseBookList(doc) {
    var items = [];
    var seen = {};
    doc.select("article.category-story-card").forEach(function (row) {
        var item = parseBookRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang danh sach ("") = het. Site dung nut
// `#loadMoreStories` + `data-next-url` (URL day du trang sau); hien tai
// cac trang mau deu co data-next-url rong (chi 1 trang).
function mtcNextPage(doc) {
    var btn = doc.select("#loadMoreStories").first();
    if (btn === null) return "";
    var nxt = btn.attr("data-next-url") || "";
    nxt = cleanText(nxt);
    if (!nxt) return "";
    if (nxt.indexOf("http") === 0) return nxt;
    return absUrl(nxt);
}

// Viet hoa chu cai dau moi tu ("tien hiep" -> "Tiên Hiệp",
// "Tu chân văn minh" -> "Tu Chân Văn Minh").
function titleCaseVi(text) {
    var words = cleanText(text).split(/\s+/);
    var out = [];
    var i = 0;
    for (i = 0; i < words.length; i++) {
        var w = words[i];
        if (!w) continue;
        out.push(w.charAt(0).toUpperCase() + w.slice(1));
    }
    return out.join(" ");
}

// Chon ten the loai dep nhat trong cac text cung 1 slug (site viet khong
// nhat quan: "Tiên Hiệp" / "Tiên hiệp" / "dammy" vs "Đam Mỹ").
// Uu tien: nhieu tu nhat, roi nhieu chu hoa nhat.
function bestGenreText(texts) {
    var best = "";
    var bestWords = 0;
    var bestCaps = 0;
    var i = 0;
    for (i = 0; i < texts.length; i++) {
        var t = cleanText(texts[i]);
        if (!t || t.length < 2) continue;
        var words = t.split(/\s+/).length;
        var caps = 0;
        var j = 0;
        for (j = 0; j < t.length; j++) {
            var ch = t.charAt(j);
            if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) caps++;
        }
        if (words > bestWords || (words === bestWords && caps > bestCaps)) {
            best = t;
            bestWords = words;
            bestCaps = caps;
        }
    }
    if (!best) return "";
    return titleCaseVi(best);
}
