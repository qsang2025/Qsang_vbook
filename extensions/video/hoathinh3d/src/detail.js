// detail.js — thong tin chi tiet mot phim tu API /phim/<slug>.
// Tra ve {name, author (dao dien), cover, description (HTML mo ta, app
// tu flatten ve text), detail (chuoi thong tin), url, type video,
// format series, ongoing, genres (chip the loai -> search.js)}.
//
// Load: build se copy config.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('helper.js');

function execute(url) {
    var slug = slugFromDetailUrl(url);
    if (!slug) return Response.error("Không đọc được slug phim từ URL: " + url);

    var json = fetchJson(BASE_URL + "/phim/" + slug);
    if (!json || !json.movie) return Response.error("Không tải được thông tin phim: " + url);
    var m = json.movie;

    var genres = [];
    var cats = m.category || [];
    var i = 0;
    for (i = 0; i < cats.length; i++) {
        if (!cats[i].slug || !cats[i].name) continue;
        genres.push({ title: cats[i].name, input: "/v1/api/danh-sach/hoat-hinh?country=trung-quoc&category=" + cats[i].slug, script: "search.js" });
    }

    var status = m.status || "";
    var info = "";
    if (m.year) info += "Năm: " + m.year;
    if (status) info += (info ? " · " : "") + "Trạng thái: " + (status === "completed" ? "Hoàn thành" : status === "ongoing" ? "Đang chiếu" : status);
    if (m.episode_current) info += (info ? " · " : "") + "Số tập: " + m.episode_current;
    if (m.episode_total) info += "/" + m.episode_total;
    if (m.quality) info += (info ? " · " : "") + "Chất lượng: " + m.quality;
    if (m.lang) info += (info ? " · " : "") + "Ngôn ngữ: " + m.lang;
    if (m.time) info += (info ? " · " : "") + "Thời lượng: " + m.time;

    // Diem danh gia IMDb / TMDB
    var rateStr = "";
    if (m.imdb && m.imdb.vote_average) {
        rateStr = "IMDb: " + m.imdb.vote_average + " ⭐" + (m.imdb.vote_count ? " (" + m.imdb.vote_count + ")" : "");
    } else if (m.tmdb && m.tmdb.vote_average) {
        rateStr = "TMDB: " + m.tmdb.vote_average + " ⭐" + (m.tmdb.vote_count ? " (" + m.tmdb.vote_count + ")" : "");
    }
    if (rateStr) info += (info ? " · " : "") + rateStr;
    if (m.view) info += (info ? " · " : "") + "Lượt xem: " + m.view;

    var directors = "";
    if (m.director) directors = m.director.join(", ");
    var actors = "";
    if (m.actor) actors = m.actor.join(", ");

    return Response.success({
        name: m.name || m.origin_name || slug,
        author: directors || actors || "",
        cover: coverUrl(m.poster_url || m.thumb_url),
        description: m.content || "",
        detail: info,
        url: BASE_URL + "/phim/" + slug,
        type: "video",
        format: "series",
        ongoing: status !== "completed",
        genres: genres
    });
}
