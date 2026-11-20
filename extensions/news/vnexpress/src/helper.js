// helper.js — ham dung chung cua extension VnExpress (vnexpress.net, loai news).
//
// Cau truc live khao sat 2026-11-20 (HTML render phia server, khong can JS):
//   danh sach chuyen muc: article.art_item > .thumb_art a.thumb_img (img),
//     h2/h3.title_news a (ten + link), p.short_intro a (lead, kem nut
//     binh luan a.icon_commend can bo). Phan trang: /<chuyen-muc>-p<n>.
//   tim kiem: timkiem.vnexpress.net/?q=<tu-khoa>&page=<n>, cung cau truc
//     article.art_item (HTML nen, attribute khong dau ngoac kep).
//   bai viet: h1.title_news_detail, p.metadate (ngay gio), p.short_intro
//     (lead), .fck_detail (noi dung, doan p.Normal), meta og:image,
//     meta article:tag (cac tag cach nhau bang dau phay).
// File nay duoc nap boi cac script khac, nen KHONG duoc nap them file
// nao khac o day. Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var SEARCH_BASE = "https://timkiem.vnexpress.net";

// Doc mot dong tin trong danh sach. Tra ve null neu dong khong co link
// bai viet (vd. khoi placeholder animated-background luc tai trang).
function newsItem(el) {
    var a = el.select(".title_news a").first();
    if (a === null) return null;
    var href = String(a.attr("href") || "");
    if (!href || href.indexOf(".html") === -1) return null;

    var cover = "";
    var img = el.select(".thumb_art img").first();
    if (img !== null) {
        cover = String(img.attr("src") || "");
        if (!cover) cover = String(img.attr("data-original") || "");
    }

    var description = "";
    var lead = el.select(".short_intro a").first();
    if (lead !== null) description = cleanText(lead.text());

    return {
        name: cleanText(a.text()),
        link: absUrl(href),
        cover: cover,
        description: description,
        author: "",
        time: ""
    };
}

// Doc toan bo danh sach tin tren mot trang chuyen muc / tim kiem.
// Bo dong trung link (trang chuyen muc lap bai noi bat o nhieu khoi).
function newsItems(doc) {
    var items = [];
    var seen = {};
    doc.select("article.art_item").forEach(function (el) {
        var item = newsItem(el);
        if (item === null || !item.name) return;
        if (seen[item.link]) return;
        seen[item.link] = true;
        items.push(item);
    });
    return items;
}

// URL danh sach cho search.js: query bat dau bang "/" hoac "http" la
// duong dan chuyen muc (phan trang -p<n>), con lai la tu khoa tim kiem
// (timkiem.vnexpress.net, phan trang &page=<n>).
function listUrl(query, page) {
    var p = parseInt(page, 10);
    if (!(p >= 1)) p = 1;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var base = query.indexOf("http") === 0 ? normalizeUrl(query) : BASE_URL + query;
        base = base.replace(/-p\d+$/, "").replace(/\/+$/, "");
        return p > 1 ? base + "-p" + p : base;
    }
    return SEARCH_BASE + "/?q=" + encodeURIComponent(query) + "&page=" + p;
}
