load("config.js");

function execute(url) {
    url = normalizeUrl(url);
    var tplMatch = url.match(/[?&]tpl=([^&]+)/);
    if (tplMatch) {
        return generated(url, decodeURIComponent(tplMatch[1]));
    }

    var endpoint = url;
    var qIdx = endpoint.indexOf("?");
    if (qIdx !== -1) {
        endpoint = endpoint.substring(0, qIdx);
    }
    var pageMatch = url.match(/[?&]page=(\d+)/);
    var page = pageMatch ? parseInt(pageMatch[1], 10) : 1;

    var token = "";
    try {
        token = cacheStorage.getItem("csrf");
    } catch (e) {}

    if (!/\/post\/\d+\/chapters$/.test(endpoint)) {
        var doc = fetchHtml(endpoint);
        if (!doc) return Response.error("Không thể tải thông tin mục lục từ " + endpoint);
        endpoint = chapterEndpoint(doc);
        token = saveCsrf(doc);
    }

    var response = token ? postChapters(endpoint, page, token) : null;
    if (!response || response.status === 419) {
        var homeDoc = fetchHtml(BASE_URL);
        if (!homeDoc) return Response.error("Không thể lấy phiên làm việc CSRF mới từ " + BASE_URL);
        response = postChapters(endpoint, page, saveCsrf(homeDoc));
    }

    if (!response || !response.ok) {
        var status = response ? response.status : 0;
        return Response.error("Không thể tải danh sách chương (HTTP " + status + ")");
    }

    var payload = response.json();
    var data = [];
    var links = chapterLinks(payload ? payload.html : "");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var title = el.attr("title") || el.text();
        data.push({
            name: title.replace(/\s*-\s*Cập nhật:.*$/, ""),
            url: el.attr("href"),
            host: BASE_URL
        });
    }
    return Response.success(data);
}

function generated(url, tpl) {
    var pM = url.match(/[?&]page=(\d+)/);
    var sM = url.match(/[?&]size=(\d+)/);
    var tM = url.match(/[?&]total=(\d+)/);

    var page = pM ? parseInt(pM[1], 10) : 1;
    var size = sM ? parseInt(sM[1], 10) : 20;
    var total = tM ? parseInt(tM[1], 10) : (page * size);

    var data = [];
    var start = (page - 1) * size + 1;
    var end = Math.min(page * size, total);
    for (var n = start; n <= end; n++) {
        data.push({
            name: "Chương " + n,
            url: tpl.replace("{n}", String(n)),
            host: BASE_URL
        });
    }
    return Response.success(data);
}
