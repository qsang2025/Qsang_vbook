// genrecontent.js — Danh sach truyen theo the loai cua Me Truyen Sang Tac.
//
// Trang loc chi render banner o HTML tinh — danh sach that do JS tai qua
// POST pages/fetch_stories.php (genres[]=<id>&page=<p>). Dung API POST
// truoc; that bai thi mo trang loc bang trinh duyet (JS cua site tu goi
// API). Phan trang: data-page lon nhat trong ket qua.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function buildCoverMap(doc) {
    var map = {};
    var all = doc.select("a[href*='/truyen/'], img[src*='/uploads/']");
    var lastSlug = "";
    var lastImg = "";
    var i = 0;
    for (i = 0; i < all.size(); i++) {
        var el = all.get(i);
        var href = el.attr("href") || "";
        var src = el.attr("src") || "";
        if (href.indexOf("/truyen/") !== -1 && href.indexOf("/truyen/index.php") === -1) {
            var s = extractSlug(href);
            if (s) {
                lastSlug = s;
                if (lastImg && !map[s]) map[s] = lastImg;
                lastImg = "";
            }
        } else if (src.indexOf("/uploads/") !== -1) {
            var imgUrl = el.attr("data-src") || el.attr("data-original") || src;
            if (imgUrl.indexOf("logo") === -1 && imgUrl.indexOf("banner") === -1) {
                if (imgUrl.charAt(0) === "/") imgUrl = BASE_URL + imgUrl;
                if (lastSlug && !map[lastSlug]) map[lastSlug] = imgUrl;
                lastImg = imgUrl;
            }
        }
    }
    return map;
}

function parseStoryCards(doc, cap) {
    var result = [];
    var seen = {};
    var coverMap = buildCoverMap(doc);
    var links = doc.select("a[href*='/truyen/']");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href === "/" || href.indexOf("/truyen/index.php") !== -1) continue;
        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;
        var name = a.text().trim();
        if (!name || name === "Logo" || name === "Xem thêm" || name === "Xem tất cả") continue;
        if (name.indexOf("Banner Image") !== -1) continue;
        if (name.indexOf("Banner") !== -1) continue;
        if (name.length < 2) continue;
        seen[slug] = true;
        var cover = "";
        var img = safeFirst(a.select("img"));
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
            if (cover.indexOf("logo") !== -1 || cover.indexOf("banner") !== -1) cover = "";
        }
        if (!cover && coverMap[slug]) cover = coverMap[slug];
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;
        result.push({
            name: name,
            link: "/truyen/" + slug,
            host: BASE_URL,
            cover: cover,
            description: ""
        });
        if (result.length >= cap) break;
    }
    return result;
}

function nextFromDataPage(doc, p) {
    var pages = doc.select("[data-page]");
    var maxPage = 0;
    var i = 0;
    for (i = 0; i < pages.size(); i++) {
        var v = parseInt(pages.get(i).attr("data-page") || "0", 10);
        if (!isNaN(v) && v > maxPage) maxPage = v;
    }
    if (maxPage > p) return String(p + 1);
    return "";
}

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    var genreId = (url || "").trim();
    if (!genreId) return Response.error("Thiếu mã thể loại");

    var listUrl = BASE_URL + "/index.php?quanly=truyen&theloai=" + genreId;
    var body = "genres%5B%5D=" + encodeURIComponent(genreId) + "&page=" + p;
    var r = fetchMTS(BASE_URL + "/pages/fetch_stories.php", {
        method: "POST",
        body: body,
        referer: listUrl,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest"
        }
    });
    var doc = null;
    if (r.ok && r.res) {
        try { doc = r.res.html(); } catch (e) { doc = null; }
    }
    if (!doc) {
        // Fallback: trinh duyet mo trang loc, JS cua site tu goi API.
        doc = openInBrowser(listUrl + (p > 1 ? "&page=" + p : ""));
    }
    if (!doc) return Response.error(pacedErrorMessage(r));
    var items = parseStoryCards(doc, 30);
    if (!items || items.length === 0) return Response.success([], "");
    return Response.success(items, nextFromDataPage(doc, p));
}
