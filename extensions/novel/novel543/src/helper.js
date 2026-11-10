// helper.js — ham phu cua extension 稷下書院 (novel543.com).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: map ten the loai -> slug /bookstack/, cover, parse the truyen
// o trang danh sach / tim kiem (ul.list > li.media).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file helper.js;
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js + config-helpers.js +
// fetch-helpers.js TRUOC helper.js (cac ham duoi day dung BASE_URL,
// absUrl, cleanText, fetchWithFallback, MIRROR_LIST).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Ghe query tim kiem vao URL co san, dung dau "?" hay "&" tuy URL da co query.
function queryBuilder(base, params) {
    var url = base;
    var keys = Object.keys(params);
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = params[k];
        if (v === undefined || v === null || v === "") continue;
        url = url + (url.indexOf("?") === -1 ? "?" : "&") +
            encodeURIComponent(k) + "=" + encodeURIComponent(String(v));
    }
    return url;
}

// Giai ma cac HTML entity pho bien trong tieu de/mo ta lay tu thuoc tinh HTML.
function htmlDecode(s) {
    var text = String(s === undefined || s === null ? "" : s);
    var map = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&nbsp;": " "
    };
    var key = "";
    for (key in map) {
        text = text.split(key).join(map[key]);
    }
    text = text.replace(/&#(\d+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 10));
    });
    text = text.replace(/&#x([0-9a-fA-F]+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 16));
    });
    return text;
}

// --- Rieng cho novel543.com ------------------------------------------------
// (Khao sat 2026-11-10: site tieng Trung phon the, UTF-8; 13 the loai o
// /bookstack/<slug>/, moi trang 18 truyen; ranking 40 truyen/trang.)

// Map ten the loai (dang day du + dang ngan) ve slug /bookstack/<slug>/
// de lam genres o detail.js.
function genreSlugByName(name) {
    var map = {
        "玄幻": "xuanhuan",
        "修真": "xiuzhen",
        "都市": "dushi",
        "歷史": "lishi", "历史": "lishi",
        "網遊": "wangyou", "网游": "wangyou",
        "科幻": "kehuan",
        "女頻": "nvpin", "女频": "nvpin",
        "靈異": "lingyi", "灵异": "lingyi",
        "同人": "tongren",
        "軍事": "junshi", "军事": "junshi",
        "懸疑": "xuanyi", "悬疑": "xuanyi",
        "穿越": "chuanyue",
        "其它": "other", "其他": "other"
    };
    var n = cleanText(name || "");
    return map[n] ? map[n] : "";
}

// Cover: list dung img thuong (khong lazy-load); anh that o src.
// Bo placeholder nocover neu co.
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
    if (!src) return "";
    if (src.indexOf("nocover") !== -1) return "";
    return absUrl(src);
}

// Parse MOT the truyen o trang danh sach the loai / tim kiem / xep hang:
// ul.list > li.media — media-left a > img (cover), media-content h3 a
// (ten -> /<10 so>/), p.desc (mo ta), span.author (tac gia).
// Bien the ranking: p.author (thay vi span.author), mo ta la <p> thuong
// (khong co class desc).
function parseBookItem(el) {
    var linkEl = null;
    var h3Links = el.select(".media-content h3 a");
    var i = 0;
    for (i = 0; i < h3Links.size(); i++) {
        var cand = h3Links.get(i);
        if (cleanText(cand.text())) { linkEl = cand; break; }
    }
    if (linkEl === null) linkEl = el.select(".media-content h3 a").first();
    if (linkEl === null) linkEl = el.select(".media-left a").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.text());
    if (!name) {
        var img0 = el.select(".media-left img").first();
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var cover = coverFromImg(el.select(".media-left img").first());

    var desc = cleanText(el.select("p.desc").text());
    if (!desc) {
        // Bien the ranking: mo ta la <p> khong co class, sau p.author.
        var ps = el.select(".media-content p");
        var j = 0;
        for (j = 0; j < ps.size(); j++) {
            var p = ps.get(j);
            if (p.hasClass("author")) continue;
            var t = cleanText(p.text());
            if (t) { desc = t; break; }
        }
    }

    var author = cleanText(el.select("span.author").text());
    if (!author) author = cleanText(el.select("p.author").text());

    return {
        name: htmlDecode(name),
        cover: cover,
        link: absUrl(href),
        description: desc,
        tag: author,
        host: siteOrigin()
    };
}
