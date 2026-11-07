// search.js — Tim kiem truyen tren TruyenC
load('config.js');

function normalizeLink(href) {
    if (!href) return "";
    if (href.indexOf("http") === 0) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }

    var q = encodeURIComponent(String(key).trim());
    var url = BASE_URL + "/tim-kiem?q=" + q;
    if (page && String(page) !== "1") {
        url = url + "&page=" + page;
    }

    var response = fetch(url);
    if (!response.ok) {
        // Fallback sang endpoint tim kiem khac neu /tim-kiem khong phan hoi
        url = BASE_URL + "/danh-sach/truyen-moi-0-0-0?keyword=" + q;
        if (page && String(page) !== "1") url = url + "&page=" + page;
        response = fetch(url);
    }
    if (!response.ok) return Response.error("HTTP Error: " + response.status);

    var doc = response.html();
    var novelList = [];
    var seen = {};

    doc.select("a[href*='/truyen/']").forEach(function(a) {
        var href = a.attr("href");
        if (!href) return;
        if (href.indexOf("/chuong-") !== -1) return;
        var fullLink = normalizeLink(href);
        if (seen[fullLink]) return;

        var parent = a.parent();
        var card = parent;
        for (var k = 0; k < 3; k++) {
            if (card && card.select("img").size() > 0 && card.text().length > 10) break;
            if (card && card.parent()) card = card.parent();
        }

        var name = a.attr("title");
        if (!name) {
            var hEl = (card || a).select("h2, h3, h4, .font-semibold, .font-bold").first();
            if (hEl) name = hEl.text().trim();
        }
        if (!name) name = a.text().trim();
        if (!name || name.length < 2 || name === "Đọc ngay" || name === "Xem thêm" || name === "Full") return;

        var cover = "";
        var imgEl = (card || a).select("img").first();
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
        }

        var desc = "";
        if (card) {
            var descEl = card.select("p, .text-sm, .text-gray-500, .line-clamp-2").first();
            if (descEl) desc = descEl.text().trim();
        }

        seen[fullLink] = true;
        novelList.push({
            name: name,
            link: fullLink,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    });

    if (novelList.length === 0) {
        return Response.error("Không tìm thấy truyện phù hợp.");
    }

    var next = null;
    var currentPage = page ? parseInt(page, 10) : 1;
    var nextA = doc.select("a[href*='page=" + (currentPage + 1) + "']").first();
    if (nextA) {
        next = String(currentPage + 1);
    }

    return Response.success(novelList, next);
}
