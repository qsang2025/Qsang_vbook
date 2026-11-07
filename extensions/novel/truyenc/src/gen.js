// gen.js — Danh sach truyen theo the loai / danh muc TruyenC
load('config.js');
load('fetch-helpers.js');

function normalizeLink(href) {
    if (!href) return "";
    if (href.indexOf("http") === 0) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function execute(url, page) {
    if (!url) return Response.error("Thiếu đường dẫn danh sách.");
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }

    if (page && String(page) !== "1") {
        if (url.indexOf("?") !== -1) {
            url = url + "&page=" + page;
        } else {
            url = url + "?page=" + page;
        }
    }

    var doc = fetchDoc(url);
    if (!doc) {
        var altUrl = url.replace("https://truyenc.net", "https://www.truyenc.net");
        doc = fetchDoc(altUrl);
    }
    if (!doc) return Response.error("Không thể kết nối đến TruyenC. Vui lòng kiểm tra lại mạng hoặc bấm Trang nguồn để xác minh.");

    var novelList = [];
    var seen = {};

    var links = doc.select("a[href*='/truyen/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/chuong-") !== -1) continue;

        var fullLink = normalizeLink(href);
        var cleanLink = fullLink.replace(/\/+$/, "");
        if (seen[cleanLink]) continue;

        var name = a.attr("title");
        var card = a;
        try {
            var p = a.parent();
            if (p) {
                card = p;
                var p2 = p.parent();
                if (p2 && card.select("img").size() === 0) {
                    card = p2;
                }
            }
        } catch (e1) {}

        if (!name && card) {
            var hEl = card.select("h1, h2, h3, h4, .font-semibold, .font-bold").first();
            if (hEl) name = hEl.text().trim();
        }
        if (!name) name = a.text().trim();
        if (!name || name.length < 2 || name === "Đọc ngay" || name === "Xem thêm" || name === "Full") continue;

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

        seen[cleanLink] = true;
        novelList.push({
            name: name,
            link: fullLink,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    }

    if (novelList.length === 0) {
        return Response.error("Không tìm thấy truyện trên trang (bấm Trang nguồn để kiểm tra).");
    }

    var next = null;
    var currentPage = page ? parseInt(page, 10) : 1;
    var nextA = doc.select("a[href*='page=" + (currentPage + 1) + "']").first();
    if (nextA) {
        next = String(currentPage + 1);
    }

    return Response.success(novelList, next);
}
