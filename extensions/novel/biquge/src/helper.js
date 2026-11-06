// helper.js — ham phu cua extension 笔趣阁 (biquge.tw).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: map ten the loai -> slug /sort/, parse the truyen o trang
// danh sach the loai (.item) va ket qua tim kiem (.result-card).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     load('config.js');
//     load('config-helpers.js');
//     load('helper.js');
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js + config-helpers.js TRUOC
// helper.js (cac ham duoi day dung BASE_URL, absUrl, cleanText).
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

// --- Rieng cho biquge.tw -------------------------------------------------
// (Khao sat 2026-11-06: site tieng Trung gian the, UTF-8; 8 the loai tren
// nav /sort/: xuanhuan 玄幻魔法, wuxia 武侠修真, dushi 都市言情, lishi
// 历史军事, kehuan 科幻灵异, youxi 游戏竞技, nvsheng 女生耽美, qita 其他类型.
// Tien hiep / tu tien nam trong 武侠修真; vong du nam trong 游戏竞技.)

// Map ten the loai (dang day du + dang ngan + ten nguoi dung hay goi) ve
// slug /sort/<slug>/ de lam genres o detail.js.
function genreSlugByName(name) {
    var map = {
        "玄幻魔法": "xuanhuan", "玄幻": "xuanhuan",
        "武侠修真": "wuxia", "武侠": "wuxia",
        "修真": "wuxia", "仙侠": "wuxia",
        "都市言情": "dushi", "都市": "dushi",
        "历史军事": "lishi", "历史": "lishi",
        "科幻灵异": "kehuan", "科幻": "kehuan",
        "游戏竞技": "youxi", "游戏": "youxi", "网游": "youxi",
        "女生耽美": "nvsheng", "女生": "nvsheng",
        "其他类型": "qita", "其他": "qita"
    };
    var n = cleanText(name || "");
    return map[n] ? map[n] : "";
}

// Cover: trang list dung img.lazy (anh that o data-src, src chi la
// /static/nocover.jpg placeholder). Neu khong co data-src thi tra "".
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("data-src") || "";
    if (!src) return "";
    return absUrl(src);
}

// Parse MOT the truyen o trang danh sach the loai:
// <div class="item"><div class="cover"><a><img class="lazy"
// data-src="...s.jpg"></a><span>游戏 / 全本</span></div><dl>
// <dt><a title="...">ten</a></dt><dd class="author">tac gia</dd>
// <dd class="intro">mo ta</dd><dd class="more">...
function parseBookItem(el) {
    var linkEl = el.select("dt a").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.text()) || cleanText(linkEl.attr("title"));
    if (!name) return null;
    var img = el.select(".cover img").first();
    var tag = cleanText(el.select(".cover span").text());
    var desc = cleanText(el.select("dd.intro").text());
    if (!desc) desc = cleanText(el.select("dd.author").text());
    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse MOT ket qua tim kiem (<div class="result-card">):
// .book-cover img (src that), a.book-title, .book-meta .author,
// .badge (完结/连载), .book-intro, .latest (chuong moi nhat).
function parseSearchItem(el) {
    var linkEl = el.select("a.book-title").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.text());
    if (!name) return null;
    var img = el.select(".book-cover img").first();
    var cover = "";
    if (img !== null) cover = absUrl(img.attr("src"));
    var desc = cleanText(el.select(".book-intro").text());
    var tag = cleanText(el.select(".book-meta .badge").text());
    if (!tag) tag = cleanText(el.select(".book-meta .author").text());
    if (!desc) desc = cleanText(el.select(".book-meta .author").text());
    return {
        name: htmlDecode(name),
        cover: cover,
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}
