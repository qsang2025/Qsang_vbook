// toc.js — Cứu Truyện: mục lục qua /api/v2/mangas/{id}/chapters.
// API trả toàn bộ chương trong một lần gọi (không phân trang; mẫu
// One-Punch Man 166 chương). Trả theo thứ tự chương 1 trước.
load('config.js');
load('rate-limit.js');

function execute(url) {
    var m = String(url).match(/\/mangas\/(\d+)/);
    if (!m || !m[1]) return Response.error("Thiếu mã định danh truyện.");
    var mangaId = m[1];
    var result = fetchJson(BASE_URL + "/api/v2/mangas/" + mangaId + "/chapters");
    if (!result.ok || !result.data) {
        return Response.error(apiErrorMessage(result, "mục lục"));
    }
    var raw = result.data.data;
    if (!Array.isArray(raw)) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện).");
    }
    var chapters = [];
    for (var i = raw.length - 1; i >= 0; i--) {
        var ch = raw[i];
        if (!ch || !ch.id) continue;
        var title = "C. " + ch.number;
        if (ch.name) title += ": " + ch.name;
        var desc = "";
        if (ch.created_at) desc = String(ch.created_at).substring(0, 10);
        chapters.push({
            name: title,
            url: BASE_URL + "/mangas/" + mangaId + "/chapters/" + ch.id,
            description: desc,
            lock: false,
            pay: false
        });
    }
    if (chapters.length === 0) {
        return Response.error("Truyện này chưa có chương nào.");
    }
    return Response.success(chapters);
}
