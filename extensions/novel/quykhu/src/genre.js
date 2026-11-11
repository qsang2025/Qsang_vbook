// genre.js — Danh sach the loai (lay tu menu tren trang chu).
// Site hien chi co 2 the loai: Voz, Gioi Thieu (kiem chung 2026-11-11).
load("config.js");
load("rate-limit.js");

function execute() {
    rateLimitDelay("quykhu.com");
    var doc = fetchHtml(BASE_URL);
    if (!doc) return Response.error("Không tải được trang chủ quykhu.com");
    var data = [];
    doc.select(".qk-cat-menu__item").forEach(function (e) {
        var title = e.text().trim();
        var href = e.attr("href");
        if (title && href) data.push({ title: title, input: href, script: "gen.js" });
    });
    return Response.success(data);
}
