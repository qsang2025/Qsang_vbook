// helper.js — ham phu cua extension 繁體小說 (novels.com.tw).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: loc nhan nguoi lon, map ten the loai -> ID, lay cover tu
// img.lazy, parse the truyen o trang danh sach / trang chu / ket qua tim
// kiem (ca 3 dang item cua site deu dung chung parser o day).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file config.js;
//     file config-helpers.js;
//     file helper.js;
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

// --- Rieng cho novels.com.tw ---------------------------------------------
// (Khao sat 2026-11-06: site tieng Trung phon the; the truyen day du la
// <li> chua .img_span (cover img.lazy + span the loai/trang thai) +
// .w100 (h2 ten + p.indent mo ta + .li_bottom tac gia/so chu/thoi gian);
// trang chu co them 2 dang item rut gon: <ul class="popular odd">
// (ten + tac gia) va <ul class="odd"> (the loai + ten + chuong moi nhat);
// ket qua tim kiem la <li class="searchresult">.

// Nhan the loai nguoi lon — GIU LAI theo yeu cau truc tiep cua nguoi
// dung ngay 2026-11-06 (dao nguoc chi dan loai bo ban dau). Ham nay chi
// dung de nhan dien, KHONG dung de loc ket qua.
function isAdultLabel(tag) {
    var t = String(tag || "");
    return t.indexOf("成人") !== -1 || t.indexOf("肉文") !== -1 || t.indexOf("精肉") !== -1;
}

// Map ten the loai (dang day du tren trang the loai + dang ngan tren nav)
// ve ID /nosort/<N>/ (khao sat 2026-11-06; ID 8 khong ton tai).
// 11/12/13 la the loai nguoi lon — GIU LAI theo yeu cau cua nguoi dung
// ngay 2026-11-06.
function genreIdByName(name) {
    var map = {
        "玄幻魔法": 1, "玄幻": 1,
        "武俠修真": 2, "武俠": 2,
        "都市言情": 3, "都市": 3,
        "曆史軍事": 4, "曆史": 4,
        "科幻靈異": 5, "科幻": 5,
        "遊戲競技": 6, "遊戲": 6,
        "女生耽美": 7, "女生": 7,
        "其他類型": 9, "其他": 9,
        "短篇": 10,
        "成人小說": 11, "成人": 11,
        "肉文小說": 12, "肉文": 12,
        "精肉小說": 13, "精肉": 13
    };
    var n = cleanText(name || "");
    return map[n] ? map[n] : 0;
}

// Cover: trang list/search dung img.lazy (anh that o data-original,
// src chi la nocover.jpg placeholder); trang chu/detail dung src that.
// Tra ve URL tuyet doi (co the la nocover.jpg neu truyen that su khong co
// cover — site tu fallback ve anh nay qua onerror).
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("data-original") || img.attr("src");
    if (!src) return "";
    return absUrl(src);
}

// Parse MOT the truyen day du (<li> chua .img_span + .w100) — dung chung
// cho trang chu muc 大神小说 va trang danh sach the loai /nosort/.
// Tra ve doi tuong item hoac null neu khong phai the truyen.
// (Khong loc truyen nguoi lon — tra du nhu site tra, theo yeu cau cua
// nguoi dung ngay 2026-11-06.)
function parseNovelCard(li) {
    var linkEl = li.select('a[href*="/novels/"]').first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;

    var name = "";
    var h2 = li.select("h2").first();
    if (h2 !== null) name = cleanText(h2.text());
    var img = li.select("img").first();
    if (!name && img !== null) {
        name = cleanText(img.attr("title")) || cleanText(img.attr("alt"));
    }
    if (!name) return null;

    var tag = cleanText(li.select(".img_span span").text());

    var desc = cleanText(li.select("p.indent").text());
    var author = cleanText(li.select(".li_bottom a").text());
    if (!desc && author) desc = author;

    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse MOT dong rut gon o <ul class="popular odd"> (muc 热门小说 / 最新小说
// tren trang chu): chi co link ten truyen + link tac gia (class gray).
function parseSimpleRow(li) {
    var linkEl = li.select('a[href*="/novels/"]').first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    var name = cleanText(linkEl.text());
    if (!href || !name) return null;
    var author = cleanText(li.select("a.gray").text());
    return {
        name: htmlDecode(name),
        cover: "",
        link: absUrl(href),
        description: author,
        tag: "",
        host: siteOrigin()
    };
}

// Parse MOT dong o <ul class="odd"> (muc 最新章节 tren trang chu):
// <span>「the loai」</span> + link ten truyen + link chuong moi (gray) +
// <span> tac gia + ngay. description = ten chuong moi nhat.
function parseLatestChapterRow(li) {
    var anchors = li.select('a[href*="/novels/"]');
    var novelLink = "";
    var novelName = "";
    var chapName = "";
    var i = 0;
    for (i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var h = a.attr("href");
        if (!h) continue;
        if (h.indexOf(".html") !== -1) {
            if (!chapName) chapName = cleanText(a.text());
        } else if (!novelLink) {
            novelLink = h;
            novelName = cleanText(a.text());
        }
    }
    if (!novelLink || !novelName) return null;
    var genre = cleanText(li.select("span").first() !== null ? li.select("span").first().text() : "");
    genre = genre.replace(/^[「\[]+|[」\]]+$/g, "");
    return {
        name: htmlDecode(novelName),
        cover: "",
        link: absUrl(novelLink),
        description: chapName,
        tag: genre,
        host: siteOrigin()
    };
}

// Parse MOT ket qua tim kiem (<li class="searchresult">).
// Tra ve doi tuong item hoac null neu khong phai ket qua.
// (Khong loc truyen nguoi lon — tra du nhu site tra, theo yeu cau cua
// nguoi dung ngay 2026-11-06.)
function parseSearchItem(el) {
    var linkEl = el.select('.img_span a[href*="/novels/"]').first();
    if (linkEl === null) linkEl = el.select('a[href*="/novels/"]').first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;

    var name = "";
    var h3 = el.select("h3").first();
    if (h3 !== null) name = cleanText(h3.text());
    var img = el.select("img").first();
    if (!name && img !== null) {
        name = cleanText(img.attr("title")) || cleanText(img.attr("alt"));
    }
    if (!name) return null;

    var tag = cleanText(el.select(".img_span span").text());

    var desc = cleanText(el.select("p.searchresult_p").text());
    if (!desc) {
        // Du phong: dong tac gia + so chu (bo icon user).
        var ps = el.select("p");
        if (ps.size() > 0) desc = cleanText(ps.get(0).text());
    }

    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}
