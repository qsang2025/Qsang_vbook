// detail.js — Cứu Truyện: chi tiết truyện qua /api/v2/mangas/{id}.
// Đọc ẩn danh, không cần đăng nhập (kể cả truyện gắn cờ is_nsfw — đã
// xác minh từ VM: truyện nsfw id 5200 đọc được chi tiết + mục lục + chương).
load('config.js');
load('rate-limit.js');

function execute(url) {
    var m = String(url).match(/\/mangas\/(\d+)/);
    if (!m || !m[1]) return Response.error("Thiếu mã định danh truyện.");
    var mangaId = m[1];
    var result = fetchJson(BASE_URL + "/api/v2/mangas/" + mangaId);
    if (!result.ok || !result.data || !result.data.data) {
        return Response.error(apiErrorMessage(result, "thông tin truyện"));
    }
    var d = result.data.data;
    var name = d.name || "";
    if (!name) {
        return Response.error("Không đọc được thông tin truyện (site có thể đã đổi giao diện).");
    }
    var author = "";
    if (d.author && d.author.name) author = d.author.name;
    var description = d.full_description || d.description || "";
    var info = [];
    if (author) info.push("Tác giả: " + author);
    if (d.chapters_count !== undefined && d.chapters_count !== null) info.push("Số chương: " + d.chapters_count);
    if (d.team && d.team.name) info.push("Nhóm dịch: " + d.team.name);
    if (d.is_nsfw) info.push("Truyện 18+");
    var genres = [];
    if (Array.isArray(d.tags)) {
        for (var i = 0; i < d.tags.length; i++) {
            var tag = d.tags[i];
            if (!tag || !tag.slug || !tag.name) continue;
            if (isBlockedTag(tag)) continue;
            genres.push({
                title: tag.name,
                input: BASE_URL + "/api/v2/tags/" + tag.slug,
                script: "gen.js"
            });
        }
    }
    var ongoing = true;
    if (Array.isArray(d.tags)) {
        for (var k = 0; k < d.tags.length; k++) {
            var tname = String((d.tags[k] && d.tags[k].name) || "");
            if (tname === "đã hoàn thành") ongoing = false;
            if (tname === "đang tiến hành") ongoing = true;
        }
    }
    return Response.success({
        name: name,
        author: author,
        cover: d.cover_url || "",
        description: description,
        detail: info.join(" • "),
        url: BASE_URL + "/mangas/" + mangaId,
        type: "comic",
        format: "comic",
        ongoing: ongoing,
        genres: genres
    });
}
