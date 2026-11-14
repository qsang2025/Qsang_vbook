// gen.js — Danh sach truyen (tab trang chu + the loai), qua AJAX cua site.
// - /hoan-thanh.html -> chuyenmuc 193; /truyen-cho-full.html -> chuyenmuc 194
//   POST sources/ajax/mong-truyen-truyen-danh-muc.php {page, limit:12, chuyenmuc}
// - /the-loai/<slug> -> POST sources/ajax/ajax-pagination.php
//   {page, limit:24, theloai, do:"pagination_theloai"}
// Ca hai tra JSON {html, total_page}; card .hydrosite-mong-truyen-book-card.
load("config.js");
load("rate-limit.js");

function parseCards(htmlContent) {
    var list = [];
    if (!htmlContent) return list;
    var doc = null;
    try {
        doc = Html.parse(htmlContent);
    } catch (e) {
        return list;
    }
    var elements = doc.select(".hydrosite-mong-truyen-book-card");
    for (var i = 0; i < elements.size(); i++) {
        var el = elements.get(i);
        var linkEl = selFirst(el, ".hydrosite-mong-truyen-book-thumbnail a");
        var link = linkEl ? normalizeUrl(linkEl.attr("href") || "") : "";
        var imgEl = selFirst(el, ".hydrosite-mong-truyen-book-thumbnail img");
        var cover = imgEl ? normalizeUrl(imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
        var name = cleanText(selFirst(el, ".hydrosite-mong-truyen-book-title") ? selFirst(el, ".hydrosite-mong-truyen-book-title").text() : "");
        var author = cleanText(selFirst(el, ".hydrosite-mong-truyen-book-author") ? selFirst(el, ".hydrosite-mong-truyen-book-author").text() : "");
        // Site tu chen hau to "- Chuong N" vao ten truyen tren card.
        if (name.indexOf("- Chương") !== -1) name = cleanText(name.split("- Chương")[0]);
        if (link && name) {
            list.push({ name: name, link: link, cover: cover, description: author, host: BASE_URL });
        }
    }
    return list;
}

function execute(url, page) {
    if (!page) page = "1";
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var postUrl = "";
    var body = null;
    if (url.indexOf("hoan-thanh.html") !== -1) {
        postUrl = BASE_URL + "/sources/ajax/mong-truyen-truyen-danh-muc.php";
        body = { page: String(pageNum), limit: "12", chuyenmuc: "193" };
    } else if (url.indexOf("truyen-cho-full.html") !== -1) {
        postUrl = BASE_URL + "/sources/ajax/mong-truyen-truyen-danh-muc.php";
        body = { page: String(pageNum), limit: "12", chuyenmuc: "194" };
    } else if (url.indexOf("/the-loai/") !== -1) {
        var slug = url.split("/the-loai/")[1].split("?")[0].replace(/\.html$/, "").replace(/\/+$/, "");
        if (!slug) return Response.error("Link thể loại không hợp lệ: " + url);
        postUrl = BASE_URL + "/sources/ajax/ajax-pagination.php";
        body = { page: String(pageNum), limit: "24", theloai: slug, do: "pagination_theloai" };
    } else {
        return Response.error("Link danh sách không hỗ trợ: " + url);
    }

    var pr = ttlFetchPost(postUrl, body, url);
    if (pr.error) return Response.error(pr.error);
    var resJson = null;
    try {
        resJson = pr.res.json();
    } catch (e) {
        return Response.error("Không đọc được danh sách truyện (site trả về không phải JSON): " + url);
    }
    if (!resJson) return Response.error("Không đọc được danh sách truyện (site trả về rỗng): " + url);
    var htmlContent = resJson.html || resJson.data || resJson.noi_dung || "";
    var list = parseCards(htmlContent);
    if (list.length === 0) return Response.error("Không đọc được danh sách truyện (site trả về rỗng): " + url);

    var next = "";
    var totalPage = parseInt(resJson.total_page || 0, 10);
    if (!isNaN(totalPage) && totalPage > pageNum) next = String(pageNum + 1);
    return Response.success(list, next);
}
