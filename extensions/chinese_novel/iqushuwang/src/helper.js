// helper.js — Parser dung chung cho iqushuwang.com.
//
// Bo cuc danh sach (kiem chung live 2026-11-16, UA mobile + probe may that):
// .article > .block > ul > li > a[href=/book/<id>/] (ten) + span (tac gia).
// 30 sach/trang, khong co bia tren trang danh sach. Pager:
// div.sort_page_num > a.page-link, link "下一页" -> trang ke; link so trang
// /list/<cat>/<n>.html hoac /<sort>_0_0_0_<n>.html.
// The loai: /list/<cat>/<page>.html (cat 0 = tat ca, 1-9 = 9 the loai).
// Trang sap xep: /lastupdate_0_0_0_<n>.html (cap nhat), /allvisit_0_0_0_<n>.html
// (xep hang), /monthvisit_0_0_2_<n>.html (hoan thanh).
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 9 the loai chinh + "全部" (tu nav trang /list/, kiem chung live 2026-11-16).
var GENRES = [
    { title: "全部", input: "https://www.iqushuwang.com/list/0/1.html", script: "gen.js" },
    { title: "玄幻奇幻", input: "https://www.iqushuwang.com/list/1/1.html", script: "gen.js" },
    { title: "修真武侠", input: "https://www.iqushuwang.com/list/2/1.html", script: "gen.js" },
    { title: "都市情感", input: "https://www.iqushuwang.com/list/3/1.html", script: "gen.js" },
    { title: "历史军事", input: "https://www.iqushuwang.com/list/4/1.html", script: "gen.js" },
    { title: "网游竞技", input: "https://www.iqushuwang.com/list/5/1.html", script: "gen.js" },
    { title: "科幻冒险", input: "https://www.iqushuwang.com/list/6/1.html", script: "gen.js" },
    { title: "浪漫言情", input: "https://www.iqushuwang.com/list/7/1.html", script: "gen.js" },
    { title: "耽美同人", input: "https://www.iqushuwang.com/list/8/1.html", script: "gen.js" },
    { title: "其他类型", input: "https://www.iqushuwang.com/list/9/1.html", script: "gen.js" }
];

// Lay <id> so cua truyen tu URL dang /book/<id>/ hoac /book/<id>.html;
// tra "" khi khong phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/book\/(\d+)(?:\/|\.html|$)/);
    return m ? m[1] : "";
}

// So trang hien tai trong URL danh sach: /list/<cat>/<n>.html -> n;
// /<sort>_0_0_0_<n>.html -> n. Mac dinh 1.
function currentListPage(url) {
    var m = String(url || "").match(/\/(\d+)\.html$/);
    if (m) return parseInt(m[1], 10);
    var m2 = String(url || "").match(/_(\d+)\.html$/);
    if (m2) return parseInt(m2[1], 10);
    return 1;
}

// URL trang <pageNum> tu URL trang hien tai: thay so trang cuoi cung
// (/list/<cat>/<n>.html hoac /<sort>_0_0_0_<n>.html) bang so moi.
function buildListPageUrl(url, pageNum) {
    var s = String(url || "");
    if (/\/\d+\.html$/.test(s)) return s.replace(/\/\d+\.html$/, "/" + pageNum + ".html");
    if (/_\d+\.html$/.test(s)) return s.replace(/_\d+\.html$/, "_" + pageNum + ".html");
    return s;
}

// Parser MOT dong truyen trong danh sach (.article .block li). Ten lay tu
// a; mo ta = tac gia trong span; khong co bia tren trang danh sach.
function parseBookItem(li, seen) {
    var a = safeFirst(li.select("a[href*=\"/book/\"]"));
    if (a === null) a = safeFirst(li.select("a"));
    if (a === null) return null;
    var href = String(a.attr("href") || "");
    var id = bookId(href);
    if (!id) return null;
    var link = BASE_URL + "/book/" + id + "/";
    if (seen[link]) return null;

    var name = cleanText(a.text());
    if (!name) return null;
    seen[link] = 1;

    var author = "";
    var sp = safeFirst(li.select("span"));
    if (sp !== null) author = cleanText(sp.text());

    return {
        name: name,
        cover: "",
        link: link,
        description: author
    };
}

// Parser toan bo danh sach .article .block tren 1 trang (trang the loai,
// trang sap xep, trang ket qua tim kiem — cung bo cuc).
function parseListItems(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select(".article .block li");
    for (var i = 0; i < rows.size(); i++) {
        var one = parseBookItem(rows.get(i), seen);
        if (one !== null) items.push(one);
    }
    return items;
}

// Fallback khi trang ket qua tim kiem khong dung bo cuc .article .block:
// quet moi link /book/<id>/ tren trang (bo qua link nav lap lai).
function parseSearchFallback(doc) {
    var items = [];
    var seen = {};
    var as = doc.select("a[href*=\"/book/\"]");
    for (var i = 0; i < as.size(); i++) {
        var a = as.get(i);
        var href = String(a.attr("href") || "");
        var id = bookId(href);
        if (!id) continue;
        var link = BASE_URL + "/book/" + id + "/";
        if (seen[link]) continue;
        var name = cleanText(a.text());
        if (!name || name.length < 2) continue;
        if (name === "开始阅读" || name === "章节目录" || name === "加入书架") continue;
        seen[link] = 1;
        items.push({ name: name, cover: "", link: link, description: "" });
    }
    return items;
}

// So trang ke tiep (dang chuoi so trang, "" khi het). Doc link "下一页"
// trong div.sort_page_num; so trang hien tai lay tu URL.
function nextListPageToken(doc, url) {
    var links = doc.select(".sort_page_num a");
    var hasNext = false;
    for (var i = 0; i < links.size(); i++) {
        var t = cleanText(links.get(i).text());
        if (t === "下一页") { hasNext = true; break; }
    }
    if (!hasNext) return "";
    var cur = currentListPage(url);
    if (isNaN(cur) || cur < 1) cur = 1;
    return String(cur + 1);
}
