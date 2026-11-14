// homecontent.js — Noi dung cac tab trang chu.
// - newupdate: API /api/newupdatestory (JSON, 20 muc moi nhat). PHAN
//   TRANG API HONG PHIA SERVER (?page=2 tra giong het trang 1) nen token
//   trang ke luon "" — chi co 1 trang (xem ghi chu config.js).
// - popular: trang xep hang /bang-xep-hang/thang/doc-nhieu?page=N
//   (HTML, 24 muc/trang, the li.xianxia-item; phan trang Laravel
//   ?page=N hoat dong). KHONG dung API cho tab nay (API khong co tham
//   so sap xep theo luot xem).
// - completed: trang /truyen-hoan-thanh?page=N (HTML, the
//   article.completed-card rieng, khac the card thuong).
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;
    if (url === "newupdate") return fetchApiUpdate(p);
    if (url === "popular") return fetchPopular(p);
    if (url === "completed") return fetchCompleted(p);
    return Response.error("Tab không hợp lệ");
}

function apiItemToCard(item) {
    var name = item.tentruyen || "";
    var slug = item.slug_post || "";
    if (!name || !slug) return null;
    var cover = item.image ? IMG_BASE + item.image : "";
    return { name: name, link: "/xem-truyen/" + slug, host: BASE_URL, cover: cover, description: item.author || "" };
}

function fetchApiUpdate(p) {
    var rr = ttlFetchJson(BASE_URL + "/api/newupdatestory?page=" + p);
    if (rr.error) return Response.error(rr.error);
    var json = rr.data || {};
    var data = json.data || [];
    var items = [];
    for (var i = 0; i < data.length; i++) {
        var card = apiItemToCard(data[i]);
        if (!card) continue;
        items.push(card);
    }
    // Phan trang API hong phia server (trang 2 giong het trang 1) — chi
    // tra 1 trang, token ke luon "" (xem ghi chu config.js).
    return Response.success(items, "");
}

// Tab "Doc nhieu": bang xep hang thang cua site (24 muc/trang).
function fetchPopular(p) {
    var rr = ttlFetchDoc(BASE_URL + "/bang-xep-hang/thang/doc-nhieu?page=" + p);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var lis = doc.select("li.xianxia-item");
    var items = [];
    var seen = {};
    for (var i = 0; i < lis.size(); i++) {
        var li = lis.get(i);
        var a = selFirst(li, "a.story-title[href*='/xem-truyen/']");
        if (!a) continue;
        var href = a.attr("href");
        if (!href || seen[href]) continue;
        seen[href] = true;
        var name = cleanText(a.text());
        if (!name) continue;
        var imgEl = selFirst(li, ".story-cover-container img");
        var cover = "";
        if (imgEl) cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
        var authorEl = selFirst(li, ".story-author");
        var author = authorEl ? cleanText(authorEl.text()) : "";
        var statsEl = selFirst(li, ".story-stats");
        var stats = statsEl ? cleanText(statsEl.text()) : "";
        var desc = author;
        if (stats) desc = desc ? (desc + " | " + stats + " lượt đọc") : (stats + " lượt đọc");
        var link = href.indexOf("http") === 0 ? href : BASE_URL + href;
        items.push({ name: name, link: link, host: BASE_URL, cover: cover, description: desc });
    }
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, getNextPage(doc, p));
}

function fetchCompleted(p) {
    var rr = ttlFetchDoc(BASE_URL + "/truyen-hoan-thanh?page=" + p);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var cards = doc.select("article.completed-card");
    var items = [];
    var seen = {};
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var a = selFirst(card, "a[href*='/xem-truyen/']");
        if (!a) continue;
        var href = a.attr("href");
        if (!href || seen[href]) continue;
        seen[href] = true;
        var titleEl = selFirst(card, "h2.completed-card__title");
        var name = titleEl ? cleanText(titleEl.text()) : "";
        if (!name) {
            var t = a.attr("title") || "";
            name = cleanText(t.replace(/^Xem truyện\s+/i, ""));
        }
        if (!name) continue;
        var imgEl = selFirst(card, "img");
        var cover = "";
        if (imgEl) cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
        var authorEl = selFirst(card, "p.completed-card__author");
        var author = authorEl ? cleanText(authorEl.text()).replace(/^Tác giả:\s*/i, "") : "";
        var metaEl = selFirst(card, ".completed-card__meta");
        var meta = metaEl ? cleanText(metaEl.text()) : "";
        var desc = author;
        if (meta) desc = desc ? (desc + " | " + meta) : meta;
        var link = href.indexOf("http") === 0 ? href : BASE_URL + href;
        items.push({ name: name, link: link, host: BASE_URL, cover: cover, description: desc });
    }
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, getNextPage(doc, p));
}
