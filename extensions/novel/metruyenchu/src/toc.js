// toc.js — Danh sach chuong Me Truyen Chu (ho tro phan trang AJAX /get/listchap)
load('config.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    var data = [];

    // Parse trang 1 tu HTML ban dau
    var el = doc.select("#chapter-list li a");
    if (el.size() === 0) {
        el = doc.select("#chapter-list a");
    }
    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        var name = e.text().trim();
        var chapterUrl = e.attr("href");
        if (name && chapterUrl) {
            data.push({
                name: name,
                url: chapterUrl,
                host: BASE_URL
            });
        }
    }

    // Trich xuat storyId tu page(storyId, pageNum) de lay cac trang sau
    var pageHtml = doc.html();
    var storyIdMatch = pageHtml.match(/page\((\d+),/);
    if (storyIdMatch) {
        var storyId = storyIdMatch[1];
        var totalPages = 1;
        var pageMatches = pageHtml.match(/page\(\d+,\s*(\d+)\)/g);
        if (pageMatches) {
            for (var p = 0; p < pageMatches.length; p++) {
                var numMatch = pageMatches[p].match(/page\(\d+,\s*(\d+)\)/);
                if (numMatch) {
                    var pageNum = parseInt(numMatch[1], 10);
                    if (pageNum > totalPages) {
                        totalPages = pageNum;
                    }
                }
            }
        }

        // Fetch cac trang tiep theo qua AJAX API
        for (var pNum = 2; pNum <= totalPages; pNum++) {
            var apiUrl = BASE_URL + "/get/listchap/" + storyId + "?page=" + pNum;
            var apiResponse = fetch(apiUrl);
            if (apiResponse.ok) {
                var json = apiResponse.json();
                if (json && json.data) {
                    var chapterDoc = Html.parse(json.data);
                    var chapters = chapterDoc.select("li a");
                    if (chapters.size() === 0) {
                        chapters = chapterDoc.select("a");
                    }
                    if (chapters.size() === 0) break;
                    for (var j = 0; j < chapters.size(); j++) {
                        var c = chapters.get(j);
                        var cName = c.text().trim();
                        var cUrl = c.attr("href");
                        if (cName && cUrl) {
                            data.push({
                                name: cName,
                                url: cUrl,
                                host: BASE_URL
                            });
                        }
                    }
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    if (data.length === 0) {
        return Response.error("Không tìm thấy danh sách chương.");
    }

    return Response.success(data);
}
