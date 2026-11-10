// helper.js — ham phu cua extension 书海阁 (shuhaige.tw).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: map ten the loai -> slug /<slug>/, cover truc tiep (khong
// lazy-load), parse the truyen o trang danh sach (2 layout: div.item o
// trang 1 the loai, div.novelslist2 > ul > li o trang N>=2 va bang xep
// hang), va fetchDocWithFallback (thu mirror qua fetchWithFallback, tra
// Document hoac null).
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

// --- Rieng cho shuhaige.tw -------------------------------------------------
// (Khao sat 2026-11-07: site tieng Trung gian the, UTF-8, HTML SSR;
// 16 the loai, URL /<slug>/ trang 1, /<slug>/<N>.html trang N>=2:
// xuanhuan 玄幻奇幻, wuxia 武侠仙侠, dushi 都市生活, lishi 历史军事,
// youxi 游戏竞技, kehuan 科幻未来, xuanyi 恐怖悬疑, qita 其他类型,
// guyan 古代言情, xianyan 现代言情, huanqing 幻想奇缘, zongcai 游戏情缘,
// qingchun 浪漫青春, wangluo 言情美文, mmkehuan 科幻灵异, mmqita 其他类型.)

// Map ten the loai (dang day du + dang ngan, ke ca hau to nhu 都市生活)
// ve slug /<slug>/ de lam genres o detail.js.
function genreSlugByName(name) {
    var map = {
        "玄幻奇幻": "xuanhuan", "玄幻": "xuanhuan",
        "武侠仙侠": "wuxia", "武侠": "wuxia", "仙侠": "wuxia",
        "都市生活": "dushi", "都市": "dushi",
        "历史军事": "lishi", "历史": "lishi", "军事": "lishi",
        "游戏竞技": "youxi", "游戏": "youxi",
        "科幻未来": "kehuan", "科幻": "kehuan",
        "恐怖悬疑": "xuanyi", "恐怖": "xuanyi", "悬疑": "xuanyi",
        "其他类型": "qita", "其他": "qita",
        "古代言情": "guyan", "古代": "guyan",
        "现代言情": "xianyan", "现代": "xianyan",
        "幻想奇缘": "huanqing", "幻想": "huanqing",
        "游戏情缘": "zongcai",
        "浪漫青春": "qingchun", "青春": "qingchun",
        "言情美文": "wangluo", "美文": "wangluo",
        "科幻灵异": "mmkehuan", "灵异": "mmkehuan",
        "言情": "xianyan"
    };
    var n = cleanText(name || "");
    return map[n] ? map[n] : "";
}

// Cover: src truc tiep (khong lazy-load), host shuhaige_tw.tupianxs.com.
// Neu chi co placeholder mac dinh thi tra "".
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("src") || img.attr("data-src") || img.attr("data-original") || "";
    if (!src) return "";
    if (src.indexOf("nocover") !== -1) return "";
    if (src.indexOf("default_no_thumbnail") !== -1) return "";
    return absUrl(src);
}

// Parse MOT the truyen o trang 1 the loai: div.item > div.image > a
// (ten + link /{id}.html, img cover) + dl > dt > span (tac gia) + dt > a
// (ten) + dd (mo ta).
function parseFeaturedItem(el) {
    var linkEl = el.select("div.image a").first();
    if (linkEl === null) linkEl = el.select("dl dt a").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.attr("title")) || cleanText(linkEl.text());
    if (!name) return null;
    var img = el.select("div.image img").first();
    if (img === null) img = el.select("img").first();
    var author = cleanText(el.select("dl dt span").text());
    var desc = cleanText(el.select("dl dd").text());
    if (author) desc = author + (desc ? " — " + desc : "");
    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: absUrl(href),
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse MOT dong o bang div.novelslist2 > ul > li (trang N>=2 the loai,
// bang xep hang /allvisit/, /allvote/, /goodnum/, /lastupdate/):
// span.s1 [the loai], span.s2 > a ten -> /{id}.html, span.s3 > a chuong
// moi, span.s4 > a tac gia, span.s5 so chu, span.s6 trang thai,
// span.s7 thoi gian. Dong dau tien la header (chu in dam) -> bo qua.
function parseRowItem(el) {
    var nameEl = el.select("span.s2 a").first();
    if (nameEl === null) return null;
    var href = nameEl.attr("href");
    var name = cleanText(nameEl.text());
    if (!href || !name) return null;
    // Dong header co the <b> trong span.s2, khong co href that -> da loai o tren.
    var genreText = cleanText(el.select("span.s1").text()).replace(/[\[\]]/g, "");
    var latest = el.select("span.s3 a").first();
    var author = cleanText(el.select("span.s4").text());
    var words = cleanText(el.select("span.s5").text());
    var status = cleanText(el.select("span.s6").text());
    var tag = genreText;
    if (status) tag = tag ? tag + " / " + status : status;
    var desc = "";
    if (author) desc += author;
    if (latest !== null) desc += (desc ? " — " : "") + cleanText(latest.text());
    if (words) desc += (desc ? " — " : "") + words;
    return {
        name: htmlDecode(name),
        cover: "",
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse MOT the o trang /quanben/ (khong co novelslist2): div.novelslist
// > div.content > div.top > div.image > a + dl > dt > a (ten) + dd (mo ta).
function parseTopItem(el) {
    var linkEl = el.select("div.image a").first();
    if (linkEl === null) linkEl = el.select("dl dt a").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.attr("title")) || cleanText(linkEl.text());
    if (!name) return null;
    var img = el.select("div.image img").first();
    if (img === null) img = el.select("img").first();
    var desc = cleanText(el.select("dl dd").text());
    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: absUrl(href),
        description: desc,
        tag: "完结",
        host: siteOrigin()
    };
}

// Ket qua tim kiem dung 1 trong 3 layout tren tuy trang tra ve.
function parseSearchItem(el) {
    var item = null;
    if (el.select("div.image").size() > 0 || el.hasClass("item")) {
        item = parseFeaturedItem(el);
        if (item) return item;
    }
    if (el.select("span.s2").size() > 0) {
        item = parseRowItem(el);
        if (item) return item;
    }
    return parseFeaturedItem(el);
}

// Lay Document, thu mirror neu domain chinh chet (dung MIRROR_LIST trong
// config.js qua fetchWithFallback trong fetch-helpers.js). Tra ve Document
// hoac null. Dung thay cho fetchDoc() o cac script cua extension nay.
