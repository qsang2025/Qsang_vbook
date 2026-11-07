// helper.js — ham phu cua extension 思兔閱讀 (sto9.com).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: map ten the loai -> id /novels/class/, cover lazy-load
// (data-src), parse the truyen o trang danh sach / tim kiem
// (ul#article_list_content > li), va fetchDocWithFallback (thu mirror
// qua fetchWithFallback, tra Document hoac null).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     load('config.js');
//     load('config-helpers.js');
//     load('fetch-helpers.js');
//     load('helper.js');
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

// --- Rieng cho sto9.com --------------------------------------------------
// (Khao sat 2026-11-07: site tieng Trung phon the, UTF-8; 11 the loai,
// URL /novels/class/{id}_{page}.html, 15 truyen/trang:
// 0 全部分類, 1 玄幻奇幻, 2 武俠仙俠, 3 現代都市, 4 歷史軍事,
// 5 科幻小說, 6 遊戲競技, 7 恐怖靈異, 8 言情小說, 9 動漫同人,
// 10 其他類型.)

// Map ten the loai (dang day du + dang ngan) ve id /novels/class/<id>/
// de lam genres o detail.js.
function genreIdByName(name) {
    var map = {
        "全部分類": "0", "全部": "0",
        "玄幻奇幻": "1", "玄幻": "1",
        "武俠仙俠": "2", "武俠": "2", "仙俠": "2",
        "現代都市": "3", "都市": "3",
        "歷史軍事": "4", "歷史": "4", "軍事": "4",
        "科幻小說": "5", "科幻": "5",
        "遊戲競技": "6", "遊戲": "6",
        "恐怖靈異": "7", "恐怖": "7", "靈異": "7",
        "言情小說": "8", "言情": "8",
        "動漫同人": "9", "動漫": "9", "同人": "9",
        "其他類型": "10", "其他": "10"
    };
    var n = cleanText(name || "");
    return map[n] ? map[n] : "";
}

// Cover: trang list dung lazy-load (anh that o data-src, src chi la
// /images/nocover.jpg placeholder). Neu chi co placeholder thi tra "".
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
    if (!src) return "";
    if (src.indexOf("nocover") !== -1) return "";
    return absUrl(src);
}

// Parse MOT the truyen o trang danh sach the loai / tim kiem:
// ul#article_list_content > li — a.imgbox img (cover data-src),
// .newnav h3 a (ten -> /book/{id}.html), .labelbox label x3 =
// tac gia / the loai / trang thai, ol.ellipsis_2 (mo ta),
// .zxzj a (chuong moi nhat).
function parseBookItem(el) {
    // LUU Y (test tren may that 2026-11-07): the <a class="imgbox"> bao
    // ca <div class="newnav"> nen <a> trong <h3> la <a> long nhau —
    // jsoup (HTML5 adoption agency) tach thanh 2 <a> trong h3: <a
    // class="imgbox"> rong + <a> that co ten. .first() se trung <a>
    // rong -> ten "" -> item bi loai het. Phai chon <a> dau tien CO text.
    var linkEl = null;
    var h3Links = el.select(".newnav h3 a");
    var i = 0;
    for (i = 0; i < h3Links.size(); i++) {
        var cand = h3Links.get(i);
        if (cleanText(cand.text())) { linkEl = cand; break; }
    }
    if (linkEl === null) linkEl = el.select(".newnav h3 a").first();
    if (linkEl === null) linkEl = el.select("a.imgbox").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var name = cleanText(linkEl.text());
    if (!name) return null;
    var img = el.select("a.imgbox img").first();
    if (img === null) img = el.select("img").first();
    var labels = el.select(".labelbox label");
    var genreText = labels.size() > 1 ? cleanText(labels.get(1).text()) : "";
    var statusText = labels.size() > 2 ? cleanText(labels.get(2).text()) : "";
    var tag = genreText;
    if (statusText) tag = tag ? tag + " / " + statusText : statusText;
    var desc = cleanText(el.select("ol.ellipsis_2").text());
    if (!desc) desc = cleanText(el.select(".zxzj").text());
    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Ket qua tim kiem dung cung cau truc item nhu trang the loai.
function parseSearchItem(el) {
    return parseBookItem(el);
}

// Lay Document, thu mirror neu domain chinh chet (dung MIRROR_LIST trong
// config.js qua fetchWithFallback trong fetch-helpers.js). Tra ve Document
// hoac null. Dung thay cho fetchDoc() o cac script cua extension nay.
function fetchDocWithFallback(url) {
    var res = fetchWithFallback(url, MIRROR_LIST);
    if (!res) return null;
    if (res.browser) return res.doc;
    try {
        return res.html();
    } catch (e) {
        return null;
    }
}
