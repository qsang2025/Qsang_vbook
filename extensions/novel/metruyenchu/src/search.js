// search.js — Tim kiem truyen tren Me Truyen Chu
load('config.js');

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }

    var url = BASE_URL + "/search?q=" + encodeURIComponent(String(key).trim());
    if (page && String(page) !== '1') {
        url = url + "&page=" + page;
    }

    var response = fetchWithMirrors(url);
    if (!response || !response.ok) return Response.error("HTTP Error: " + (response ? response.status : "không kết nối được máy chủ"));
    var doc = response.html();
    var novelList = [];

    doc.select(".truyen-list .item").forEach(function (e) {
        var titleEl = e.select("h3 a").first();
        if (!titleEl) return;

        var name = titleEl.text().trim();
        var link = titleEl.attr("href");
        if (!name || !link) return;

        var cover = "";
        var coverEl = e.select(".cover img").first();
        if (coverEl) {
            cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        }

        var desc = "";
        var authorEl = e.select("a[href*='/tac-gia/']").first();
        if (authorEl) {
            desc = "Tác giả: " + authorEl.text().trim();
        }

        novelList.push({
            name: name,
            link: link,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    });

    if (novelList.length === 0) {
        return Response.error("Không tìm thấy truyện phù hợp.");
    }

    var currentPage = page ? parseInt(page, 10) : 1;
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
    // nextToken LUON la string: "" khi het trang, khong bao gio null.
    var next = findNextPage(doc, currentPage);

    return Response.success(novelList, next);
}
