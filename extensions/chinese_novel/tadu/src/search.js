// search.js — tim kiem theo tu khoa tren Tadu.
// Form tim kiem cua site: POST /search, tham so "query"
// (tham so "key"/"keyword" bi site bo qua, chi tra danh sach hot).
// Trang 1 dung POST; cac trang sau dung GET:
//   /search?query=<kw>&pageSize=30&pageNum=<n>
// Ket qua cung cau truc .bookList > li nhu trang store (30 ket qua/trang).
// Phan trang qua form#pageForm (data-page). Kiem chung live 2026-11-12:
// POST query=剑来 tra 3009 ket qua, trang 1 co 30 truyen.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function maxPageNo(doc) {
    var max = 1;
    var links = doc.select("form#pageForm a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var n = parseInt(el.attr("data-page"), 10);
        if (!isNaN(n) && n > max) max = n;
        var m = el.attr("href").match(/pageNum=(\d+)/);
        if (m) {
            n = parseInt(m[1], 10);
            if (!isNaN(n) && n > max) max = n;
        }
    }
    return max;
}

function execute(query, page) {
    query = safeString(query);
    if (!query) return Response.success([]);
    var pageNo = parseInt(page || "1", 10);
    if (!pageNo || pageNo < 1) pageNo = 1;

    var response = null;
    if (pageNo <= 1) {
        response = fetchPage(BASE_URL + "/search", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "query=" + encodeURIComponent(query)
        });
    } else {
        response = fetchPage(BASE_URL + "/search?query=" + encodeURIComponent(query) + "&pageSize=30&pageNum=" + pageNo);
    }
    if (!response.ok) return Response.error("Không tải được kết quả tìm kiếm (HTTP " + response.status + ")");

    var doc = response.html();
    var data = [];
    var rows = doc.select(".bookList > li");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var nameEl = safeFirst(row.select(".rtList a.bookNm"));
        if (!nameEl) continue;
        var name = cleanText(nameEl.text());
        var link = buildAbsoluteUrl(nameEl.attr("href"));
        if (!name || !link) continue;

        var cover = "";
        var imgEl = safeFirst(row.select("a.bookImg img"));
        if (imgEl) {
            var src = imgEl.attr("data-src") || imgEl.attr("src");
            if (src && src.indexOf("coverBg") === -1) cover = fixCover(src);
        }

        var author = "";
        var authorEl = safeFirst(row.select("a.authorNm"));
        if (authorEl) author = cleanText(authorEl.text());
        var intro = "";
        var introEl = safeFirst(row.select("a.bookIntro"));
        if (introEl) intro = cleanText(introEl.text());
        var description = author;
        if (intro) description = description ? description + " · " + intro : intro;
        if (description.length > 200) description = description.substring(0, 200);

        data.push({ name: name, link: link, cover: cover, description: description, host: BASE_URL });
    }

    if (data.length === 0) return Response.success([]);
    var next = pageNo < maxPageNo(doc) ? String(pageNo + 1) : "";
    return Response.success(data, next);
}
