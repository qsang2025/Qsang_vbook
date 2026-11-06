// book.js — renderer danh sach dung chung cua 繁體小說 (novels.com.tw).
// home.js / genre.js tro ve day. Nhan query la:
//   - input tab trang chu ("/home/dashen"...) — parse muc tuong ung
//     tren trang chu / (khong phan trang)
//   - duong dan the loai /nosort/<N>/<page>/ — 10 truyen/trang,
//     token trang ke tinh tu link phan trang lon nhat
//   - URL day du (trang the loai hoac trang chu)
//   - tu khoa (phong khi tab nao tro thang vao day) — tim kiem.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Tab trang chu (home.js): input gia, book.js tu fetch trang chu /
// roi parse muc tuong ung. Thu tu <ul class="popular odd"> tren trang:
// cai 1 = 热门小说, cai 2 = 最新小说 (khao sat 2026-11-06).
var HOME_SECTIONS = {
    "/home/dashen": "cards",
    "/home/remen": "popular0",
    "/home/zuixin": "popular1",
    "/home/zuixinzhangjie": "latest"
};

function dedupeAdd(items, seen, item) {
    if (item && !seen[item.link]) {
        seen[item.link] = true;
        items.push(item);
    }
}

// Parse muc trang chu tu Document cua trang /.
function listHomeSection(kind) {
    var doc = fetchDoc(BASE_URL + "/");
    if (!doc) return { items: [], next: "", error: "Không tải được trang chủ: " + BASE_URL + "/" };
    var items = [];
    var seen = {};
    if (kind === "cards") {
        // 大神小说: <ul class="flex"> the day du.
        doc.select("ul.flex li").forEach(function (li) {
            dedupeAdd(items, seen, parseNovelCard(li));
        });
    } else if (kind === "popular0" || kind === "popular1") {
        // 热门小说 / 最新小说: 2 <ul class="popular odd"> (dong rut gon).
        var uls = doc.select("ul.popular.odd");
        var idx = kind === "popular0" ? 0 : 1;
        var ul = uls.size() > idx ? uls.get(idx) : null;
        if (ul !== null) {
            ul.select("li").forEach(function (li) {
                dedupeAdd(items, seen, parseSimpleRow(li));
            });
        }
    } else if (kind === "latest") {
        // 最新章节: <ul class="odd"> (the loai + ten + chuong moi).
        doc.select("ul.odd li").forEach(function (li) {
            dedupeAdd(items, seen, parseLatestChapterRow(li));
        });
    }
    return { items: items, next: "", error: "" };
}

// Parse trang danh sach the loai /nosort/<N>/<page>/ (10 truyen/trang).
// next = so trang ke tinh tu link phan trang lon nhat (site co toi 7.029
// trang o the loai 玄幻 — khong doan mo, doc tu pager that).
function listGenre(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;
    var pageUrl = url.replace(/\/\d+\/?$/, "/" + n + "/");
    var doc = fetchDoc(pageUrl);
    if (!doc) return { items: [], next: "", error: "Không tải được trang danh sách: " + pageUrl };

    var items = [];
    var seen = {};
    doc.select("ul.flex li").forEach(function (li) {
        dedupeAdd(items, seen, parseNovelCard(li));
    });

    var maxPage = n;
    doc.select('a[href*="/nosort/"]').forEach(function (a) {
        var m = String(a.attr("href")).match(/\/nosort\/\d+\/(\d+)\//);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    });

    return { items: items, next: maxPage > n ? String(n + 1) : "", error: "" };
}

function listBooksResponse(url, page) {
    var result = listGenre(url, page);
    if (result.error) return Response.error(result.error);
    return Response.success(result.items, result.next);
}

function execute(query, page) {
    query = query || "";
    page = page || "1";

    if (HOME_SECTIONS[query]) {
        var home = listHomeSection(HOME_SECTIONS[query]);
        if (home.error) return Response.error(home.error);
        return Response.success(home.items, home.next);
    }

    var url = "";
    if (query.indexOf("http") === 0) {
        url = query;
    } else if (query.indexOf("/") === 0) {
        url = BASE_URL + query;
    } else if (query) {
        // Tu khoa: tim kiem (parse dang searchresult).
        var surl = BASE_URL + "/search/?searchkey=" + encodeURIComponent(query);
        var sdoc = fetchDoc(surl);
        if (!sdoc) return Response.error("Không tải được kết quả tìm kiếm: " + surl);
        var sitems = [];
        var sseen = {};
        sdoc.select("li.searchresult").forEach(function (el) {
            dedupeAdd(sitems, sseen, parseSearchItem(el));
        });
        return Response.success(sitems, "");
    } else {
        url = BASE_URL + "/nosort/1/1/";
    }

    if (url.indexOf("/nosort/") !== -1) return listBooksResponse(url, page);

    // URL day du khac (vd trang chu): parse the day du neu co.
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang danh sách: " + url);
    var items = [];
    var seen = {};
    doc.select("ul.flex li").forEach(function (li) {
        dedupeAdd(items, seen, parseNovelCard(li));
    });
    return Response.success(items, "");
}
