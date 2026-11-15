// helper.js — ham dung chung cua extension 無限小說 (8book.com).
//
// - GENRES: 11 the loai cua site (kiem chung live 2026-11-16 tu nav
//   "小說分類" tren trang chu): /booklists/<id>/.
// - parseBookCard(el): 1 muc sach trong the div.shadow-sm.bg-white
//   (dung cho trang the loai, trang tim kiem, trang danh sach): anh bia
//   img.cover120, ten trong li.nowraphide dau tien cua the a.w-100, mo ta
//   trong a.w-100 (attr title) hoac div.row_detail, tag la the loai trong
//   li.cat-smbtn.
// - nextPageHref(doc, currentUrl): trang ke trong .pager — site dung 2
//   kieu phan trang: /booklists/2/2.html (onclick '<n>.html') va
//   /search/?key=...&page=<n> (onclick co page=<n>). Lay so trang nho
//   nhat > trang hien tai trong cac so tim duoc; "" khi het.
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 11 the loai (id so trong /booklists/<id>/).
var GENRES = [
    { title: "魔法異界", input: "/booklists/1/" },
    { title: "仙俠武俠", input: "/booklists/2/" },
    { title: "都市言情", input: "/booklists/3/" },
    { title: "穿越重生", input: "/booklists/4/" },
    { title: "懸疑靈異", input: "/booklists/5/" },
    { title: "游戲競技", input: "/booklists/6/" },
    { title: "玄幻奇幻", input: "/booklists/8/" },
    { title: "日輕小說", input: "/booklists/9/" },
    { title: "軍事紀實", input: "/booklists/10/" },
    { title: "歷史名著", input: "/booklists/11/" },
    { title: "動漫同人", input: "/booklists/14/" }
];

// 1 muc sach trong danh sach; tra ve null neu khong du ten/link.
function parseBookCard(el) {
    var linkA = safeFirst(el.select("a.w-100"));
    if (linkA === null) linkA = safeFirst(el.select("a[href*='/novelbooks/']"));
    if (linkA === null) return null;
    var link = absUrl(linkA.attr("href"));
    if (!link) return null;
    var name = "";
    var titleLi = safeFirst(el.select("li.nowraphide"));
    if (titleLi !== null) name = cleanText(titleLi.text());
    if (!name) name = cleanText(linkA.text());
    if (!name) {
        var img0 = safeFirst(el.select("img"));
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;
    var cover = "";
    var img = safeFirst(el.select("img.cover120"));
    if (img === null) img = safeFirst(el.select("img[src*='/pics/']"));
    if (img !== null) cover = absUrl(img.attr("src"));
    var desc = cleanText(linkA.attr("title"));
    if (!desc) {
        var rd = safeFirst(el.select("div.row_detail"));
        if (rd !== null) desc = cleanText(rd.text());
    }
    if (desc.length > 200) desc = desc.substring(0, 200);
    var tag = "";
    var cat = safeFirst(el.select("li.cat-smbtn"));
    if (cat !== null) tag = cleanText(cat.text());
    return { name: name, cover: cover, link: link, description: desc, tag: tag, host: siteOrigin() };
}

// Tat ca muc sach trong 1 trang danh sach (the loai / tim kiem / list).
function parseItemList(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select("div.shadow-sm.bg-white");
    for (var i = 0; i < cards.size(); i++) {
        var one = parseBookCard(cards.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    return items;
}

// So trang hien tai trong URL: /booklists/2/2.html -> 2; ?page=3 -> 3;
// mac dinh 1.
function currentPageNum(url) {
    var m = String(url).match(/[?&]page=(\d+)/);
    if (m) return parseInt(m[1], 10);
    var m2 = String(url).match(/\/(\d+)\.html$/);
    if (m2) return parseInt(m2[1], 10);
    return 1;
}

// URL trang ke trong .pager: tra ve URL tuyet doi, "" khi het.
// Kieu .html: /booklists/2/ -> /booklists/2/2.html; /booklists/2/2.html
// -> /booklists/2/3.html. Kieu ?page=: giu nguyen query, doi page=<n>.
function nextPageHref(doc, currentUrl) {
    var cur = currentPageNum(currentUrl);
    var bestNum = 0;
    var bestUrl = "";
    var pager = doc.select(".pager li");
    for (var i = 0; i < pager.size(); i++) {
        var li = pager.get(i);
        var oc = li.attr("onclick") || "";
        var a = safeFirst(li.select("a"));
        var href = a !== null ? (a.attr("href") || "") : "";
        var cand = oc + " " + href;
        var m = cand.match(/page=(\d+)/);
        var num = 0;
        var url = "";
        if (m) {
            num = parseInt(m[1], 10);
            var base = String(currentUrl).replace(/([?&])page=\d+/, "$1page=" + num);
            if (base === String(currentUrl)) {
                var sep = String(currentUrl).indexOf("?") === -1 ? "?" : "&";
                base = String(currentUrl) + sep + "page=" + num;
            }
            url = base;
        } else {
            var m2 = cand.match(/(\d+)\.html/);
            if (m2) {
                num = parseInt(m2[1], 10);
                var dir = String(currentUrl).replace(/\/[^\/]*$/, "/");
                if (String(currentUrl).match(/\/\d+\.html$/)) dir = String(currentUrl).replace(/\/\d+\.html$/, "/");
                url = dir + num + ".html";
            }
        }
        if (num > cur && (bestNum === 0 || num < bestNum)) {
            bestNum = num;
            bestUrl = url;
        }
    }
    if (!bestUrl) return "";
    return absUrl(bestUrl);
}
