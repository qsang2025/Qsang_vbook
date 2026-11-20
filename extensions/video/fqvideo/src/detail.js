// detail.js — thong tin chi tiet mot bo phim ngan / hoat hinh FQ Video.
// Ho tro ca URL hongguoduanju.com (/detail?series_id=..., /player/...) va
// URL tuong thich fanqienovel.com/page/<id>?fq_type=(short|animation).
// Tra ve type "video", format "series", genres (chip the loai tro ve search.js),
// va ghi chu ro pham vi 5 tap dau mien phi tren web cong khai.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function buildAuthor(celebrities) {
    if (!(celebrities instanceof Array) || celebrities.length === 0) return "Fanqie / Hồng Quả";
    var names = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < celebrities.length && names.length < 4; i++) {
        var c = celebrities[i];
        var nick = cleanText(c && c.nickname ? c.nickname : "");
        if (!nick || seen[nick]) continue;
        seen[nick] = true;
        names.push(nick);
    }
    return names.length > 0 ? names.join(", ") : "Fanqie / Hồng Quả";
}

function buildGenres(tags) {
    var genres = [];
    if (!(tags instanceof Array)) return genres;
    var seen = {};
    var i = 0;
    for (i = 0; i < tags.length; i++) {
        var t = cleanText(tags[i]);
        if (!t || seen[t]) continue;
        seen[t] = true;
        var input = t.length > 30 ? t.substring(0, 30) : t;
        genres.push({ title: t, input: input, script: "search.js" });
    }
    return genres;
}

function execute(url) {
    var seriesId = extractSeriesId(url);
    if (!seriesId) {
        return Response.error("URL phim không hợp lệ (không tìm thấy mã series_id): " + String(url || ""));
    }

    var res = fetchSeriesDetail(seriesId);
    if (!res.ok) return Response.error(res.error);

    var sd = res.detail;
    var social = res.social || {};

    var name = cleanText(sd.series_name || sd.series_title || "");
    if (!name) return Response.error("Không đọc được tên phim cho ID " + seriesId + ".");

    var cover = normalizeCover(sd.series_cover || "");
    var description = cleanText(sd.series_intro || "");
    var author = buildAuthor(sd.celebrities);
    var epInfo = sd.series_episode_info || {};
    var epCount = parseInt(sd.episode_cnt || epInfo.episode_cnt || 0, 10) || 0;
    var accessibleCnt = parseInt(sd.accessible_episode_cnt, 10);
    if (isNaN(accessibleCnt) || accessibleCnt < 0) accessibleCnt = 5;

    var epText = cleanText(sd.episode_right_text || "");
    if (!epText && epCount > 0) epText = "Tổng " + epCount + " tập";

    var ongoing = true;
    if (epInfo.series_status === 1 || epText.indexOf("全") === 0) {
        ongoing = false;
    }

    var infoParts = [];
    if (epText) infoParts.push("Số tập: " + epText);
    if (social.rating) infoParts.push("Điểm: " + social.rating);
    if (social.rank_label) infoParts.push("BXH: " + cleanText(social.rank_label));
    if (social.hot_score_data && social.hot_score_data.text) {
        infoParts.push("Độ hot: " + cleanText(social.hot_score_data.text));
    }
    infoParts.push(
        "Lưu ý: Web công khai mở miễn phí " + accessibleCnt +
        " tập đầu (từ tập " + (accessibleCnt + 1) + "+ cần xem trên ứng dụng Fanqie / Hồng Quả)."
    );

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: infoParts.join(" · "),
        url: res.url,
        type: "video",
        format: "series",
        ongoing: ongoing,
        genres: buildGenres(sd.tags)
    });
}
