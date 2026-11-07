// toc.js — Danh sach chuong tren TruyenC
load('config.js');
load('fetch-helpers.js');

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

    var doc = fetchDoc(url);
    if (!doc) {
        var altUrl = url.replace("https://truyenc.net", "https://www.truyenc.net");
        doc = fetchDoc(altUrl);
    }
    if (!doc) return Response.error("Không tải được danh sách chương: " + url);

    var chapters = [];
    var seen = {};

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

    var fullText = doc.text();
    var chMatch = fullText.match(/(\d+)\s*(?:Chương|chương)/i);
    var totalChapters = chMatch ? parseInt(chMatch[1], 10) : 0;

    var cleanBase = url.replace(/\/+$/, "");
    if (totalChapters > 0 && chapters.length < totalChapters) {
        var completeChapters = [];
        for (var i = 1; i <= totalChapters; i++) {
            var chUrl = cleanBase + "/chuong-" + i;
            var chName = "Chương " + i;
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
