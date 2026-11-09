// detail.js — thong tin chi tiet mot video Dailymotion.
// GET https://api.dailymotion.com/video/<id>?fields=id,title,description,
//     thumbnail_720_url,owner.screenname,duration,created_time,views_total,tags
// (da kiem chung 2026-11-06 voi video x98x90i "Tiểu Môn Thần").
// Video Dailymotion la video don le -> format "stream", ongoing false.
// Chip the loai chi gan tu tags THAT cua video (API tra ve, kiem chung
// 2026-11-09: da so video tags rong, mot so co tag tieng Trung nhu
// "热门短剧" — bam chip se tim theo chinh tag do). Neu video khong co
// tag thi KHONG gan chip the loai chung (tranh gan sai); chip tim kiem
// theo tu khoa chon san van nam o home.js / genre.js.
//
// Load: build se copy config.js, config-helpers.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var id = videoIdFromUrl(url);
    if (!id) return Response.error("Không đọc được id video từ URL: " + url);

    var apiUrl = API_BASE + "/video/" + id +
        "?fields=id,title,description,thumbnail_720_url,owner.screenname,duration,created_time,views_total,bookmarks_total,tags";
    var v = dmApiGet(apiUrl);
    if (!v || !v.title) return Response.error("Không tải được thông tin video: " + url);

    var owner = cleanText(v["owner.screenname"]);
    var dur = formatDuration(v.duration);
    var views = "";
    if (v.views_total !== undefined && v.views_total !== null) {
        views = String(v.views_total);
    }
    var detail = "";
    if (dur) detail = "Thời lượng: " + dur;
    if (owner) detail = detail ? detail + " • Kênh: " + owner : "Kênh: " + owner;
    if (views) detail = detail ? detail + " • Lượt xem: " + views : "Lượt xem: " + views;
    if (v.bookmarks_total) detail += " • Yêu thích: " + v.bookmarks_total;

    // Chip the loai chi tu tags THAT cua video (khu trung, toi da 8 chip).
    // Tag nao bam vao cung tro ve search.js voi chinh tag do lam tu khoa
    // (da kiem chung: tim "热门短剧" tra 1000 ket qua). Video khong co tag
    // thi bo luon truong genres thay vi gan 4 chip chung sai.
    var genres = [];
    var seenTag = {};
    var i = 0;
    var rawTags = v.tags;
    if (rawTags && rawTags.length) {
        for (i = 0; i < rawTags.length && genres.length < 8; i++) {
            var t = cleanText(rawTags[i]);
            if (t && !seenTag[t]) {
                seenTag[t] = true;
                genres.push({ title: t, input: t, script: "search.js" });
            }
        }
    }

    var commentConfig = {
        title: "Bình luận",
        input: id,
        script: "comment.js"
    };

    var result = {
        name: cleanText(v.title),
        author: owner,
        cover: v.thumbnail_720_url ? String(v.thumbnail_720_url) : "",
        description: cleanText(v.description),
        detail: detail,
        url: watchUrl(id),
        type: "video",
        format: "stream",
        ongoing: false,
        comment: commentConfig
    };
    if (genres.length > 0) result.genres = genres;

    return Response.success(result);
}
