// helper.js — ham dung chung cua extension HHHTQ (hhhtq.team).
// Site dung MacCMS, phuc vu 2 giao dien tuy theo User-Agent:
//   - Mobile (/template/mobile/): .module-item, .module-search-item,
//     chi tiet h1.page-title, .video-cover img, muc luc #glist-1..4
//   - Desktop (MyUI): .myui-vodlist__box, #searchList li,
//     chi tiet h1.title, .myui-content__thumb img, muc luc #playlist1..4
// Tat ca ham duoi day ho tro ca 2 giao dien ma khong can xoay User-Agent.
// File nay duoc nap boi cac script khac, KHONG nap them file nao o day.
// Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js
// truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : siteOrigin();
}

// Chuyen link xem phim (/xem/195-sv1-ep1/) hoac link phim (/phim/195) ve
// URL trang chi tiet chuan (https://hhhtq.team/phim/195/).
function toDetailUrl(url) {
    var u = absUrl(url);
    var m = u.match(/\/xem\/(\d+)-sv\d+-ep\d+/i);
    if (m) return siteOrigin() + "/phim/" + m[1] + "/";
    var pm = u.match(/\/phim\/(\d+)/i);
    if (pm) return siteOrigin() + "/phim/" + pm[1] + "/";
    return u;
}

// Lay anh bia sach tu element hoac chuoi style/src, bo anh placeholder loading.png.
function cleanCoverUrl(raw) {
    var s = String(raw || "").replace(/^\s+|\s+$/g, "");
    if (!s || s.indexOf("loading.png") !== -1) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    return absUrl(s);
}

function extractStyleBg(el) {
    if (!el) return "";
    var st = String(el.attr("style") || "");
    var m = st.match(/url\((['"]?)(.*?)\1\)/i);
    return m ? cleanCoverUrl(m[2]) : "";
}

function extractImgCover(root) {
    if (!root) return "";
    var c = cleanCoverUrl(root.attr("data-original")) || cleanCoverUrl(root.attr("data-src")) || extractStyleBg(root);
    if (c) return c;
    var imgs = root.select("img");
    var i = 0;
    for (i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        c = cleanCoverUrl(img.attr("data-src")) || cleanCoverUrl(img.attr("data-original")) || cleanCoverUrl(img.attr("src"));
        if (c) return c;
    }
    var thumb = root.select("a.myui-vodlist__thumb").first();
    if (thumb !== null) {
        c = cleanCoverUrl(thumb.attr("data-original")) || cleanCoverUrl(thumb.attr("data-src")) || extractStyleBg(thumb);
        if (c) return c;
    }
    return "";
}

// Parse 1 the phim tren giao dien Mobile (.module-item hoac .module-search-item)
// va Desktop (.myui-vodlist__box hoac #searchList li).
function parseCardEl(el) {
    if (!el) return null;
    // LUU Y: Elements.first() tren runtime vBook KHONG bao gio tra null
    // (select rong van tra object rong truthy) nen khong duoc dung
    // `if (a === null)` de fallback — phai dung safeFirst (kiem size()).
    // Trang /show/ chi co link /xem/ (khong co /phim/) nen ban cu luon
    // tra 0 item o trang chu/danh muc.
    var a = safeFirst(el.select("a[href*='/phim/']"));
    if (a === null) a = safeFirst(el.select("a[href*='/xem/']"));
    if (a === null) return null;

    var rawHref = String(a.attr("href") || "");
    if (!rawHref) return null;
    var link = toDetailUrl(rawHref);

    var name = "";
    var titleEl = el.select("h3 a, h4.title a, .module-item-title, .video-name a").first();
    if (titleEl !== null) {
        name = cleanText(titleEl.text()) || cleanText(titleEl.attr("title"));
    }
    if (!name) name = cleanText(a.attr("title")) || cleanText(a.text());
    var img = el.select("img").first();
    if (!name && img !== null) name = cleanText(img.attr("alt"));
    name = name.replace(/^Xem Phim\s+/i, "");
    if (!name || name.toLowerCase().indexOf("xem thêm") !== -1) return null;

    var cover = extractImgCover(el);

    var tag = "";
    var tagEl = el.select(".pic-tag, .module-item-text, .video-serial, .text-muted").first();
    if (tagEl !== null) tag = cleanText(tagEl.text());

    var desc = "";
    var descEl = el.select(".video-text, .video-info-item").first();
    if (descEl !== null) desc = cleanText(descEl.text());
    if (!desc) {
        var capEl = el.select(".module-item-caption").first();
        if (capEl !== null) desc = cleanText(capEl.text());
    }

    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse danh sach phim tren trang tim kiem hoac trang danh mục.
// Luu y: trang tim kiem co kem cot/chan trang goi y phim hot, nen phai uu
// tien #searchList li (Desktop) va .module-search-item (Mobile) truoc.
function parseCards(doc, isSearchPage) {
    var list = [];
    var seen = {};
    if (!doc) return list;

    var rows = null;
    if (isSearchPage) {
        rows = doc.select("#searchList li");
        if (rows.size() === 0) rows = doc.select(".module-search-item");
    } else {
        rows = doc.select(".myui-vodlist__box");
        if (rows.size() === 0) rows = doc.select(".module-item");
        if (rows.size() === 0) rows = doc.select("#searchList li, .module-search-item");
    }

    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = parseCardEl(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            list.push(item);
        }
    }
    return list;
}

// Ghe so trang vao URL danh sach hoac tim kiem cua MacCMS.
function buildPagedUrl(baseUrl, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return baseUrl;
    var u = String(baseUrl || "");
    if (u.indexOf("/show/") !== -1) {
        return u.replace(/\/show\/([^\/]+)\/?$/, function (m, slug) {
            var baseSlug = slug.replace(/--------\d+---$/, "--------");
            if (baseSlug === slug) {
                baseSlug = slug.replace(/-----------$/, "--------");
            }
            if (baseSlug.indexOf("--------") !== -1) {
                return "/show/" + baseSlug + n + "---/";
            }
            return "/show/" + slug + "/";
        });
    }
    if (u.indexOf("/type/") !== -1) {
        var clean = u.replace(/\/page\/\d+\/?$/, "").replace(/\/+$/, "");
        return clean + "/page/" + n + "/";
    }
    return u;
}

// Kiem tra trang danh sach co link sang trang ke tiep khong.
function nextPageTokenHhhtq(doc, page) {
    var cur = parseInt(page, 10);
    if (isNaN(cur) || cur < 1) cur = 1;
    var next = cur + 1;
    if (!doc) return "";

    var links = doc.select("ul.myui-page a[href], #page a[href], a.page-number[href]");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = String(links.get(i).attr("href") || "");
        var m1 = href.match(/--------(\d+)---\/?$/);
        if (m1 && parseInt(m1[1], 10) === next) return String(next);
        var m2 = href.match(/\/page\/(\d+)\/?/);
        if (m2 && parseInt(m2[1], 10) === next) return String(next);
    }
    return "";
}

// Boc truong chuoi tu bien player_aaaa nhung trong trang xem phim.
// Regex la can thiet vi player_aaaa nam trong the script, khong nam trong DOM.
function extractPlayerUrl(html) {
    var text = String(html || "");
    var pm = text.match(/var\s+player_aaaa\s*=\s*\{[\s\S]*?\}/i);
    if (!pm) return "";
    var um = pm[0].match(/"url"\s*:\s*"([^"]+)"/i);
    if (!um) return "";
    return um[1].replace(/\\\//g, "/");
}
