// toc.js — Muc luc chuong qua POST /post/<id>/chapters (can CSRF token).
// Input la URL trang truyen, hoac URL trang muc luc tu page.js
// (<endpoint>?page=N[&size&total&tpl]).
load("config.js");
load("rate-limit.js");

function execute(url) {
    rateLimitDelay("quykhu.com");
    url = normalizeUrl(url);
    var tpl = url.match(/[?&]tpl=([^&]+)/);
    if (tpl) return generated(url, decodeURIComponent(tpl[1]));
    var endpoint = url.split("?")[0];
    var page = url.match(/[?&]page=(\d+)/);
    page = page ? parseInt(page[1]) : 1;
    var token = cacheStorage.getItem("csrf");
    if (!/\/post\/\d+\/chapters$/.test(endpoint)) {
        var doc = fetchHtml(endpoint);
        if (!doc) return Response.error("Không tải được trang truyện");
        endpoint = chapterEndpoint(doc);
        token = saveCsrf(doc);
    }
    var response = token ? postChapters(endpoint, page, token) : null;
    if (!response || response.status === 419) {
        // Token het han: lay token moi tu trang chu. Luu y trang chu co the
        // khong render token (meta rong) — khi do bao loi ro thay vi gui
        // POST voi token rong roi lai 419.
        var doc2 = fetchHtml(BASE_URL);
        var fresh = doc2 ? saveCsrf(doc2) : "";
        if (!fresh) return Response.error("Phiên đã hết hạn — mở lại trang chi tiết truyện rồi thử lại mục lục");
        response = postChapters(endpoint, page, fresh);
    }
    if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
    var json = null;
    try { json = response.json(); } catch (e) {}
    if (!json || !json.html) return Response.error("Máy chủ không trả danh sách chương");
    var data = [];
    chapterLinks(json.html).forEach(function (e) {
        // Vá từ bản AG: thiếu title thì lấy text làm tên chương.
        data.push({
            name: (e.attr("title") || e.text()).replace(/\s*-\s*Cập nhật:.*$/, ""),
            url: e.attr("href"),
            host: BASE_URL
        });
    });
    return Response.success(data);
}

function generated(url, tpl) {
    var page = parseInt(url.match(/[?&]page=(\d+)/)[1]);
    var size = parseInt(url.match(/[?&]size=(\d+)/)[1]);
    var total = parseInt(url.match(/[?&]total=(\d+)/)[1]);
    var data = [];
    for (var n = (page - 1) * size + 1; n <= Math.min(page * size, total); n++) {
        data.push({ name: "Chương " + n, url: tpl.replace("{n}", n), host: BASE_URL });
    }
    return Response.success(data);
}
