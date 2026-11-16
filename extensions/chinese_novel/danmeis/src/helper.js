// helper.js — Parser dung chung cho danmeis.com.
//
// Bo cuc danh sach (kiem chung live 2026-11-16, ca UA mobile):
// ul.j_bookList li.g_col_6 > div.lst-item > a.c_strong[href][title]
//   > i > img[_src] + h2 (ten) ; p.ell._tags > strong > span (tac gia,
//   the loai); mo ta o the a._p. 30 sach/trang.
// Pager: div.pagelink#pagelink > em#pagestats "N/M" + cac link so trang
// (/xuanhuan/<n>.html). Trang cuoi khong co link trang sau nen doc so
// trang tu #pagestats thay vi tim link "Trang sau".
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 6 the loai chinh (tu nav trang chu, kiem chung live 2026-11-16).
// Day la the loai chuan cua site (khong co ten the loai nguoi lon rieng
// de loc — tinh 18+ cua nguon ghi o muc source: nsfw true, mo ta ghi
// 18+; tieu de sach tren site co ghi ro NPH/SM/GL/H khi thuoc dang do).
var GENRES = [
    { title: "玄幻奇幻", input: "https://www.danmeis.com/xuanhuan", script: "gen.js" },
    { title: "武侠仙侠", input: "https://www.danmeis.com/wuxia", script: "gen.js" },
    { title: "历史军事", input: "https://www.danmeis.com/lishi", script: "gen.js" },
    { title: "都市生活", input: "https://www.danmeis.com/dushi", script: "gen.js" },
    { title: "科幻未来", input: "https://www.danmeis.com/kehuan", script: "gen.js" },
    { title: "其他类型", input: "https://www.danmeis.com/qita", script: "gen.js" }
];

// Lay <id> so cua truyen tu URL dang /book/<id>.html hoac
// /book/<id>/<n>.html; tra "" khi khong phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/book\/(\d+)(?:\.html|\/\d+\.html)?/);
    return m ? m[1] : "";
}

// URL danh muc tu slug (vd. "xuanhuan" -> https://www.danmeis.com/xuanhuan).
function categoryUrl(slug) {
    return BASE_URL + "/" + slug;
}

// Parser MOT dong truyen trong danh sach (li.g_col_6). Ten lay tu h2
// (fallback: title cua a, alt cua img); mo ta lay tu .booknews tuong duong
// (tac gia + the loai trong p._tags) + doan mo ta a._p. Bo qua dong khong
// co ten hoac trung link. Cover lay tu img[_src] (lazy-load), fallback
// img[src] neu khong phai nocover.
function parseBookItem(li, seen) {
    var a = safeFirst(li.select("a.c_strong"));
    if (a === null) a = safeFirst(li.select("a"));
    if (a === null) return null;
    var href = String(a.attr("href") || "");
    var id = bookId(href);
    if (!id) return null;
    var link = BASE_URL + "/book/" + id + ".html";
    if (seen[link]) return null;

    var name = "";
    var h2 = safeFirst(li.select("h2"));
    if (h2 !== null) name = cleanText(h2.text());
    if (!name) name = cleanText(a.attr("title") || "");
    if (!name) {
        var im0 = safeFirst(li.select("img"));
        if (im0 !== null) name = cleanText(im0.attr("alt") || "");
    }
    if (!name) return null;
    seen[link] = 1;

    var cover = "";
    var im = safeFirst(li.select("img"));
    if (im !== null) {
        cover = String(im.attr("_src") || im.attr("src") || "");
        if (cover.indexOf("nocover") !== -1) cover = "";
        if (cover && cover.indexOf("http") !== 0) cover = normalizeDmUrl(cover);
    }

    var descParts = [];
    var tags = safeFirst(li.select("p._tags"));
    if (tags !== null) {
        var t = cleanText(tags.text());
        if (t) descParts.push(t);
    }
    var dp = safeFirst(li.select("a._p"));
    if (dp !== null) {
        var d = cleanText(dp.text());
        if (d) descParts.push(d);
    }

    return {
        name: name,
        cover: cover,
        link: link,
        description: descParts.join(" | ")
    };
}

// Parser toan bo danh sach ul.j_bookList tren 1 trang (trang the loai,
// trang xep hang, trang ket qua tim kiem — cung bo cuc).
function parseListItems(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("ul.j_bookList li.g_col_6");
    for (var i = 0; i < rows.size(); i++) {
        var one = parseBookItem(rows.get(i), seen);
        if (one !== null) items.push(one);
    }
    return items;
}

// So trang ke tiep (dang chuoi so trang, "" khi het). Doc tu
// em#pagestats "N/M" trong div.pagelink: con trang sau khi N < M.
// Fallback: link so trang lon nhat trong #pagelink.
function nextPageToken(doc) {
    var stats = safeFirst(doc.select("#pagestats"));
    if (stats !== null) {
        var m = cleanText(stats.text()).match(/(\d+)\s*\/\s*(\d+)/);
        if (m) {
            var cur = parseInt(m[1], 10);
            var tot = parseInt(m[2], 10);
            if (!isNaN(cur) && !isNaN(tot) && cur < tot) return String(cur + 1);
            return "";
        }
    }
    var best = 0;
    var cur2 = 1;
    var links = doc.select("#pagelink a");
    for (var i = 0; i < links.size(); i++) {
        var h = String(links.get(i).attr("href") || "");
        var mm = h.match(/\/(\d+)\.html$/);
        if (mm) {
            var n = parseInt(mm[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    var strong = safeFirst(doc.select("#pagelink strong"));
    if (strong !== null) {
        var c = parseInt(cleanText(strong.text()), 10);
        if (!isNaN(c)) cur2 = c;
    }
    if (best > cur2) return String(cur2 + 1);
    return "";
}

// So trang hien tai trong URL danh sach: /<slug>/<n>.html -> n;
// /<slug> (khong so) -> 1; ?page=<n> -> n. Mac dinh 1.
function currentPageNum(url) {
    var m = String(url).match(/\/(\d+)\.html$/);
    if (m) return parseInt(m[1], 10);
    var m2 = String(url).match(/[?&]page=(\d+)/);
    if (m2) return parseInt(m2[1], 10);
    return 1;
}
