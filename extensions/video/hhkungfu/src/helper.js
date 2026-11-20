// helper.js — ham dung chung cua extension HHKUNGFU (hhkungfu.ee).
// Site WordPress theme HaLim (khao sat live 2026-11-20):
//   danh sach: a.halim-thumb > img.film-poster-img, span.status,
//              span.episode, h2.entry-title, p.original_title
//   chi tiet:  h1.entry-title (hoac h1), h2.org_title, meta og:image,
//              .list_cate a, .hh3d-new-ep .new-ep, .hh3d-info,
//              .halim-entry-box article p / .entry-content p
//   muc luc:   .halim-server (#Vietsub sv=1, #Thuyết Minh sv=2) > a[data-ep]
//   server:    #halim-ajax-list-server .get-eps (data-type=tiktik|pro|vip4k|vip4kv2)
//   player:    GET /player/player.php?action=dox_ajax_player&post_id=&chapter_st=&type=&sv=
// File nay duoc nap boi cac script khac, KHONG nap them file nao o day.
// Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : siteOrigin();
}

function unwrapCover(src) {
    var s = String(src === undefined || src === null ? "" : src).replace(/^\s+|\s+$/g, "");
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    return absUrl(s);
}

function parseFilmCard(a) {
    var href = String(a.attr("href") || "");
    if (!href) return null;
    var path = href;
    if (path.indexOf(BASE_URL) === 0) path = path.substring(BASE_URL.length);
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return null;
    if (/^\/(moi-cap-nhat|top-xem-nhieu|hoan-thanh|lich-chieu|lich-su|bookmark)/.test(path)) return null;

    var img = a.select("img.film-poster-img").first();
    if (img === null) img = a.select("img").first();

    var name = "";
    var h2 = a.select("h2.entry-title").first();
    if (h2 !== null) name = cleanText(h2.text());
    if (!name) name = cleanText(a.attr("title"));
    if (!name && img !== null) name = cleanText(img.attr("alt"));
    if (!name) return null;

    var cover = "";
    if (img !== null) {
        cover = unwrapCover(img.attr("data-src") || img.attr("src"));
    }

    var orig = "";
    var op = a.select("p.original_title").first();
    if (op !== null) orig = cleanText(op.text());

    var status = "";
    var st = a.select("span.status").first();
    if (st !== null) status = cleanText(st.text());
    var ep = "";
    var epEl = a.select("span.episode").first();
    if (epEl !== null) ep = cleanText(epEl.text());
    var tag = status;
    if (ep) tag = tag ? tag + " · " + ep : ep;

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: orig,
        tag: tag,
        host: siteOrigin()
    };
}

function pageUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return url;
    var base = String(url).replace(/\/+$/, "");
    var q = base.indexOf("?");
    if (q !== -1) return base.substring(0, q) + "/page/" + n + base.substring(q);
    return base + "/page/" + n;
}

function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    var cards = doc.select("a.halim-thumb");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseFilmCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }

    var maxPage = cur;
    var links = doc.select("ul.page-numbers a[href], .page-numbers a[href], a[href*='/page/']");
    for (i = 0; i < links.size(); i++) {
        var m = String(links.get(i).attr("href") || "").match(/\/page\/(\d+)\/?/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    }

    return { items: items, next: maxPage > cur ? String(cur + 1) : "" };
}

function episodeNumber(s) {
    var m = String(s || "").match(/tap-(\d+)/i);
    if (!m) m = String(s || "").match(/Tập\s*(\d+)/i);
    if (!m) m = String(s || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}
