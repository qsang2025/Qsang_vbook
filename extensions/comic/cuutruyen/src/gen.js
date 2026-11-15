// gen.js — Cứu Truyện: danh sách truyện theo tab trang chủ / thể loại.
// Input là URL API (đầy đủ hoặc đường dẫn bắt đầu bằng "/").
load('config.js');
load('rate-limit.js');

function execute(url, page) {
    var target = String(url || "");
    if (target.indexOf("http") !== 0) {
        if (target.charAt(0) !== "/") target = "/" + target;
        target = BASE_URL + target;
    }
    return parseMangaList(target, page);
}
