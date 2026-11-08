// toc.js — Danh sach chuong Truyen Hoan (50 chuong/trang, xem page.js)
// KHONG doi host cua link goc (xem config.js).
load('config.js');

function normalizeChapterHref(href, origin) {
    if (!href) return "";
    if (href.indexOf("http") === 0) return href;
    if (href.charAt(0) === "/") return origin + href;
    return origin + "/" + href;
}

function execute(url) {
    var pageUrl = normalizeSiteUrl(url);
    if (!pageUrl) {
        return Response.error("Link truyện không thuộc truyenhoan.com hay wetruyen.com. Mã truyện khác nhau giữa các mirror nên không đọc chéo mirror được.");
    }
    if (pageUrl.charAt(pageUrl.length - 1) !== "/") pageUrl = pageUrl + "/";
    var origin = siteOrigin(pageUrl);

    var response = safeFetch(pageUrl);
    if (!response) return Response.error("Không kết nối được tới trang truyện.");
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var chapters = [];
    var seen = {};

    // Chi lay link chuong that trong #list-chapter, khong gom link ngoai
    // nhu chuong moi cap nhat hay dieu huong trang.
    var links = doc.select("#list-chapter ul.list-chapter li a");
    if (links.size() === 0) {
        links = doc.select("ul.l-chapters li a");
    }

    links.forEach(function(a) {
        var raw = a.attr("href") || "";
        var chapterLink = normalizeChapterHref(raw, origin);
        var chapterTitle = a.text().trim();
        var key = chapterLink;
        if (key.charAt(key.length - 1) === "/") key = key.slice(0, -1);
        if (chapterLink && chapterTitle.length > 0 && !seen[key]) {
            seen[key] = true;
            chapters.push({
                name: chapterTitle,
                url: chapterLink,
                host: origin
            });
        }
    });

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy chương trong Danh sách chương.");
    }

    return Response.success(chapters);
}
