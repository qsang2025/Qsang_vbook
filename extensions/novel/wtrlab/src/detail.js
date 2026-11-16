// detail.js — Chi tiet truyen tu __NEXT_DATA__ cua trang chi tiet
// (execute(url) -> detail). URL vao la /en/novel/<raw_id>/<slug> — lay
// raw_id (khong phai id/serie_id, 2 so khac nhau).
// pageProps.serie.serie_data.data co: title, author (tieng Anh), mo ta,
// image; serie_data co: status, chapter_count, unlock_count, genres
// (id so), tags (id so); pageProps.tags giai id tag -> tieu de.
// Trang chi tiet KHONG co co is_adult — nhan biet 18+ qua id the loai
// (xem isAdultGenres trong file helper.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var parsed = parseDetailUrl(url);
    if (!parsed) return Response.error("Không đọc được đường dẫn truyện.");
    var detailUrl = BASE_URL + "/en/novel/" + parsed.rawId + "/" + parsed.slug;
    var r = pacedFetch(detailUrl, {
        method: "GET",
        headers: { "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        timeout: 20000,
        maxRetries: 2
    });
    if (!r.ok) {
        if (r.error === "cooldown" || r.status === 429 || r.status === 405) {
            return Response.error(rateLimitErrorMessage("WTR-LAB", "wtr-lab.com", r.cooldownRemainingMs));
        }
        if (r.status) return Response.error("Không tải được trang truyện (HTTP " + r.status + ").");
        return Response.error("Không kết nối được tới WTR-LAB, hãy kiểm tra mạng rồi thử lại.");
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e) {
        return Response.error("Không đọc được trang truyện.");
    }
    var nd = extractNextData(text);
    if (!nd || !nd.props || !nd.props.pageProps || !nd.props.pageProps.serie) {
        return Response.error("Không tìm thấy truyện.");
    }
    var pp = nd.props.pageProps;
    var serie = pp.serie;
    var sd = serie.serie_data || {};
    var d = sd.data || {};
    var title = htmlDecode(d.title || "");
    if (!title && serie.names && serie.names.length > 0) {
        title = htmlDecode(serie.names[0].title || "");
    }
    if (!title) return Response.error("Không tìm thấy truyện.");
    var author = htmlDecode(d.author || sd.author || "");
    var cover = d.image || "";
    var description = String(d.description || "");

    var statusText = STATUS_TEXT[sd.status] || "";
    var info = "";
    if (statusText) info += "Trạng thái: " + statusText + "<br>";
    if (sd.chapter_count !== undefined && sd.chapter_count !== null) {
        info += "Số chương: " + sd.chapter_count;
        if (sd.unlock_count !== undefined && sd.unlock_count !== null) {
            info += " (" + sd.unlock_count + " chương mở)";
        }
        info += "<br>";
    }
    var genreNames = [];
    var genres = [];
    var gids = sd.genres || [];
    var i = 0;
    for (i = 0; i < gids.length; i++) {
        var slug = genreSlug(gids[i]);
        if (!slug) continue;
        genreNames.push(slug);
        genres.push({
            title: slug.charAt(0).toUpperCase() + slug.substring(1),
            input: BASE_URL + "/en/novel-list?genre=" + gids[i],
            script: "gen.js"
        });
    }
    if (genreNames.length > 0) info += "Thể loại: " + genreNames.join(", ") + "<br>";
    var tagTitles = [];
    var tagMap = {};
    var tags = pp.tags || [];
    for (i = 0; i < tags.length; i++) {
        if (tags[i] && tags[i].id !== undefined) tagMap[tags[i].id] = tags[i].title;
    }
    var tids = sd.tags || [];
    for (i = 0; i < tids.length; i++) {
        if (tagMap[tids[i]]) tagTitles.push(tagMap[tids[i]]);
    }
    if (tagTitles.length > 0) info += "Tags: " + tagTitles.join(", ") + "<br>";
    if (d.raw && d.raw.author) info += "Tác giả gốc: " + htmlDecode(d.raw.author) + "<br>";
    if (sd.char_count) info += "Số ký tự: " + sd.char_count + "<br>";
    if (sd.view !== undefined && sd.view !== null) info += "Lượt xem: " + sd.view + "<br>";
    if (info.length > 0 && info.substring(info.length - 4) === "<br>") {
        info = info.substring(0, info.length - 4);
    }

    return Response.success({
        name: title,
        author: author,
        cover: cover,
        description: description,
        detail: info,
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: sd.status !== 1,
        nsfw: isAdultGenres(gids),
        locale: "en_US",
        genres: genres,
        tags: [],
        suggests: []
    });
}
