// gen.js — Danh sach truyen theo the loai hoac danh muc Me Truyen Chu
load('config.js');

function execute(url, page) {
    if (!url) return Response.error("Thiếu đường dẫn danh sách.");
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }

    if (page && String(page) !== '1') {
        if (url.indexOf("?") !== -1) {
            url = url + "&page=" + page;
        } else {
            url = url + "?page=" + page;
        }
    }

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    var novelList = [];

    // Danh sach kieu grid/list: .truyen-list .item
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

    // Neu chua co truyen (vi du trang moi cap nhat .itemupdate)
    if (novelList.length === 0) {
        doc.select(".itemupdate").forEach(function(e) {
            var titleEl = e.select(".iname h3 a").first();
            if (!titleEl) return;

            var name = titleEl.text().trim();
            var link = titleEl.attr("href");
            if (!name || !link) return;

            var desc = "";
            var genreEl = e.select(".icate a").first();
            if (genreEl) {
                desc = genreEl.text().trim();
            }

            var chapterEl = e.select(".ichapter a").first();
            if (chapterEl) {
                var chapterText = chapterEl.text().trim();
                if (desc) desc += " | " + chapterText;
                else desc = chapterText;
            }

            novelList.push({
                name: name,
                link: link,
                cover: "",
                description: desc,
                host: BASE_URL
            });
        });
    }

    if (novelList.length === 0) {
        return Response.error("Không tìm thấy truyện trên trang.");
    }

    var next = null;
    var currentPage = page ? parseInt(page, 10) : 1;
    var pageLinks = doc.select(".phan-trang a.btn-page");
    if (pageLinks.size() > 0) {
        var lastLink = pageLinks.last();
        var href = lastLink.attr("href") || "";
        if (href.indexOf("page=") !== -1) {
            var match = href.match(/page=(\d+)/);
            if (match && parseInt(match[1], 10) > currentPage) {
                next = String(currentPage + 1);
            }
        }
    }

    return Response.success(novelList, next);
}
