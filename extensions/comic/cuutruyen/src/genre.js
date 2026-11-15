// genre.js — Cứu Truyện: danh sách thể loại từ API /api/v2/tags/popular.
// Site không có hệ thống thể loại, chỉ có tag: lấy common_tags +
// normal_tags, bỏ warning_tags (bạo lực, khỏa thân, lgbt, nsfw) và ecchi.
// Manifest gắn cờ nsfw: true (tiền lệ FanMTL/ReaderNovel/WuxiaBox).
// Việc ẩn có thể đảo ngược nếu Anh yêu cầu.
load('config.js');
load('rate-limit.js');

function execute() {
    var result = fetchJson(BASE_URL + "/api/v2/tags/popular");
    if (!result.ok || !result.data || !result.data.data) {
        return Response.error(apiErrorMessage(result, "danh sách thể loại"));
    }
    var data = result.data.data;
    var genres = [];
    var seen = {};
    var lists = [];
    if (Array.isArray(data.common_tags)) lists.push(data.common_tags);
    if (Array.isArray(data.normal_tags)) lists.push(data.normal_tags);
    for (var i = 0; i < lists.length; i++) {
        var tags = lists[i];
        for (var j = 0; j < tags.length; j++) {
            var tag = tags[j];
            if (!tag || !tag.slug || !tag.name) continue;
            if (isBlockedTag(tag)) continue;
            if (seen[tag.slug]) continue;
            seen[tag.slug] = true;
            genres.push({
                title: tag.name,
                input: BASE_URL + "/api/v2/tags/" + tag.slug,
                script: "gen.js"
            });
        }
    }
    if (genres.length === 0) {
        return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện).");
    }
    return Response.success(genres);
}
