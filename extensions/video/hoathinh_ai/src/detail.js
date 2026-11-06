// detail.js — thong tin chi tiet mot video Dailymotion.
// GET https://api.dailymotion.com/video/<id>?fields=id,title,description,
//     thumbnail_720_url,owner.screenname,duration,created_time,views_total
// (da kiem chung 2026-11-06 voi video x98x90i "Tiểu Môn Thần").
// Video Dailymotion la video don le -> format "stream", ongoing false.
// The loai hien duoi dang chip tro ve search.js voi tu khoa da chon san.
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
        "?fields=id,title,description,thumbnail_720_url,owner.screenname,duration,created_time,views_total";
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

    var genres = [];
    var i = 0;
    for (i = 0; i < CURATED_QUERIES.length; i++) {
        genres.push({
            title: CURATED_QUERIES[i].title,
            input: CURATED_QUERIES[i].input,
            script: "search.js"
        });
    }

    return Response.success({
        name: cleanText(v.title),
        author: owner,
        cover: v.thumbnail_720_url ? String(v.thumbnail_720_url) : "",
        description: cleanText(v.description),
        detail: detail,
        url: watchUrl(id),
        type: "video",
        format: "stream",
        ongoing: false,
        genres: genres
    });
}
