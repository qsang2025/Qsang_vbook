// toc.js — Danh sach chuong tren TruyenC
load('config.js');

function normalizeLink(href) {
    if (!href) return "";
    if (href.indexOf("http") === 0) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    var chapters = [];
    var seen = {};

    // 1. Quet cac the a chuong co san tren trang
    doc.select("a[href*='/chuong-']").forEach(function(a) {
        var href = a.attr("href");
        if (!href) return;
        var fullLink = normalizeLink(href);
        var title = a.text().trim();
        if (title && !seen[fullLink]) {
            seen[fullLink] = true;
            chapters.push({
                name: title,
                url: fullLink,
                host: BASE_URL
            });
        }
    });

    // 2. Neu site render SSR tat ca hoac can bo sung tu tong so chuong
    var fullText = doc.text();
    var chMatch = fullText.match(/(\d+)\s*(?:Chương|chương)/i);
    var totalChapters = chMatch ? parseInt(chMatch[1], 10) : 0;

    // Base URL chuong: /truyen/<slug>/chuong-<N>
    var cleanBase = url.replace(/\/+$/, "");
    if (totalChapters > 0 && chapters.length < totalChapters) {
        // Sinh day du cac chuong theo dung URL chuan cua TruyenC
        var completeChapters = [];
        for (var i = 1; i <= totalChapters; i++) {
            var chUrl = cleanBase + "/chuong-" + i;
            var chName = "Chương " + i;
            // Neu da co ten chuong tu link tren trang thi dung ten do
            if (seen[chUrl]) {
                for (var k = 0; k < chapters.length; k++) {
                    if (chapters[k].url === chUrl) {
                        chName = chapters[k].name;
                        break;
                    }
                }
            }
            completeChapters.push({
                name: chName,
                url: chUrl,
                host: BASE_URL
            });
        }
        return Response.success(completeChapters);
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy danh sách chương.");
    }

    return Response.success(chapters);
}
