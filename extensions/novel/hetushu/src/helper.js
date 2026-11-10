// helper.js — ham phu cua extension 和图书 (hetushu.com).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: cover, parse item danh sach the loai (ul#list.book_list > li)
// va parse item dang dd (dl.list#body > dd — dung chung cho trang tim
// kiem /search/ va bang xep hang /top/index.php).
//
// File nay duoc load boi cac script can no (viet o dau file script):
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

// --- Rieng cho hetushu.com -------------------------------------------------
// (Khao sat 2026-11-10: site tieng Trung gian the, UTF-8; 13 the loai o
// /book/index.php?type=<ten-the-loai-url-encoded>, 16 truyen/trang,
// phan trang ?page=N / &page=N; bang xep hang /top/index.php 20 truyen,
// 1 trang duy nhat; tim kiem GET /search/?keyword=<tu-khoa>, 16 truyen/
// trang, phan trang ?keyword=<kw>&page=N (vd. "重生" 853 ket qua / 54
// trang); cover /book/cover.pic/cover_<id>.jpg; trang thai sach: detail
// .book_info co class "finish" (hoan thanh) hoac "continue" (dang ra),
// danh sach the loai co span.complete = 完本, span.continue = 连载.)

// Cover: img thuong (khong lazy-load); anh that o src.
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
    if (!src) return "";
    if (src.indexOf("nocover") !== -1) return "";
    return absUrl(src);
}

// Parse MOT truyen o trang danh sach the loai /book/index.php:
// ul#list.book_list > li — a > img (cover), .name a (ten),
// .author_box .complete (完本, neu co) + .author (tac gia),
// .note_box .intro (mo ta). Tag = trang thai + tac gia.
function parseGenreItem(el) {
    var nameEl = el.select(".name a").first();
    if (nameEl === null) nameEl = el.select("a[title]").first();
    if (nameEl === null) return null;
    var href = nameEl.attr("href");
    if (!href) return null;
    var name = cleanText(nameEl.text());
    if (!name) name = cleanText(nameEl.attr("title"));
    if (!name) return null;

    var cover = coverFromImg(el.select("a img").first());
    var desc = cleanText(el.select(".note_box .intro").text());
    var author = cleanText(el.select(".author_box .author").text());
    var status = cleanText(el.select(".author_box .complete").text());
    if (!status) status = "连载";
    var tag = status;
    if (author) tag = tag + " · " + author;

    return {
        name: htmlDecode(name),
        cover: cover,
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse MOT truyen dang <dd> (trang tim kiem /search/ va bang xep hang
// /top/index.php): dl.list#body > dd — a > img (cover), h4 a (ten),
// h4 span "/ tac gia /", .intro (mo ta), .list-num (so thu tu, chi o
// trang xep hang — khong lay).
function parseDdItem(el) {
    var linkEl = null;
    var h4Links = el.select("h4 a");
    var i = 0;
    for (i = 0; i < h4Links.size(); i++) {
        var cand = h4Links.get(i);
        if (cleanText(cand.text())) { linkEl = cand; break; }
    }
    if (linkEl === null) linkEl = el.select("h4 a").first();
    if (linkEl === null) linkEl = el.select("a").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.text());
    if (!name) {
        var img0 = el.select("img").first();
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var cover = coverFromImg(el.select("a img").first());
    var desc = cleanText(el.select(".intro").text());
    // Tac gia nam trong span "/ tac gia /" sau ten o h4.
    var author = cleanText(el.select("h4 span").text());
    author = author.replace(/^\s*\/\s*/, "").replace(/\s*\/\s*$/, "");

    return {
        name: htmlDecode(name),
        cover: cover,
        link: absUrl(href),
        description: desc,
        tag: author,
        host: siteOrigin()
    };
}
