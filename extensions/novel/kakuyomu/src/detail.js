// detail.js — Chi tiet truyen tu __NEXT_DATA__ cua trang chi tiet
// (execute(url) -> detail). URL vao la /works/<id>. Du lieu lay tu
// Work:<id> trong Apollo state: title, author (UserAccount), introduction,
// catchphrase, genre, serialStatus, publicEpisodeCount, totalCharacterCount,
// totalReviewPoint, lastEpisodePublishedAt, tagLabels, ogImageUrl (anh bia
// that), relatedWorks (goi y). Trang chi tiet KHONG co co 18+ rieng —
// nhan biet qua isSexual/isCruel/isViolent (truyen mau deu false).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var workId = parseWorkId(url);
    if (!workId) return Response.error("Không đọc được đường dẫn truyện.");
    var detailUrl = BASE_URL + "/works/" + workId;
    var r = fetchKakuText(detailUrl);
    if (r.error) return Response.error(r.error);
    var nd = extractNextData(r.text);
    var state = apolloState(nd);
    if (!state) return Response.error("Không tìm thấy truyện.");
    var work = state["Work:" + workId];
    if (!work || !work.title) return Response.error("Không tìm thấy truyện.");
    var title = cleanText(work.title);
    var author = workAuthorName(state, work);
    var description = String(work.introduction || "");
    var cover = work.ogImageUrl || "";

    var info = "";
    if (author) info += "作者： " + author + "<br>";
    var st = serialStatusText(work.serialStatus || "");
    if (st) info += "連載： " + st + "<br>";
    if (work.publicEpisodeCount !== undefined && work.publicEpisodeCount !== null) {
        info += "話数： " + work.publicEpisodeCount + "話<br>";
    }
    if (work.totalCharacterCount !== undefined && work.totalCharacterCount !== null) {
        info += "文字数： " + work.totalCharacterCount + "文字<br>";
    }
    if (work.totalReviewPoint !== undefined && work.totalReviewPoint !== null) {
        info += "評価ポイント： " + work.totalReviewPoint + "<br>";
    }
    if (work.lastEpisodePublishedAt) {
        info += "最終更新： " + String(work.lastEpisodePublishedAt).substring(0, 10) + "<br>";
    }
    if (work.catchphrase) info += "キャッチコピー： " + cleanText(work.catchphrase);

    var genres = [];
    var slug = GENRE_ENUM_TO_SLUG[work.genre || ""];
    if (slug) {
        genres.push({
            title: GENRE_NAMES[slug] || slug,
            input: BASE_URL + "/rankings/" + slug + "/entire?page=1&work_variation=long",
            script: "gen.js"
        });
    }
    var tags = work.tagLabels || [];
    var i = 0;
    for (i = 0; i < tags.length; i++) {
        var tag = cleanText(tags[i]);
        if (!tag) continue;
        genres.push({ title: tag, input: tag, script: "search.js" });
    }

    var suggests = [];
    var related = work["relatedWorks({\"limit\":30})"] || [];
    var j = 0;
    for (j = 0; j < related.length && suggests.length < 10; j++) {
        var ref = related[j] && related[j].__ref;
        if (!ref) continue;
        var rw = state[ref];
        if (!rw || !rw.title || !rw.id) continue;
        suggests.push({
            name: cleanText(rw.title),
            link: BASE_URL + "/works/" + rw.id,
            cover: ""
        });
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
        ongoing: work.serialStatus !== "COMPLETED",
        genres: genres,
        suggests: suggests
    });
}
