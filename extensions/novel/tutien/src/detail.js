// detail.js — Chi tiet truyen cua TruyenCv.
//
// API: GET /story/{slug}/ tra JSON day du (ten, tac gia, anh bia, mo
// ta, the loai, so chuong, luot doc, danh gia, trang thai, 3 chuong
// moi nhat, truyen tuong tu). Khong can dang nhap.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var slug = extractSlug(storyUrl);
    if (!slug) return Response.error("Không xác định được truyện");

    var r = fetchTT(BASE_URL + "/story/" + encodeURIComponent(slug) + "/", { headers: defaultHeaders() });
    if (!r.ok || !r.res) return Response.error(pacedErrorMessage(r));
    var data = null;
    try { data = r.res.json(); } catch (e) { data = null; }
    if (!data || !data.title) return Response.error("Không tải được thông tin truyện");

    var name = (data.title || "").trim();
    var author = "";
    if (data.author && data.author.name) author = data.author.name;
    var cover = storyCover(data);
    var description = (data.description || "").trim();

    // The loai chip: uu tien nhom the_loai (the loai chinh cua site),
    // fallback the loai dau tien khong thuoc nhom trang_thai (trang thai
    // nhu "Hoan Thanh" khong phai the loai). Giong logic hien thi cua
    // chinh frontend.
    var genres = [];
    var seenGenre = {};
    var gi = 0;
    var glist = data.genres || [];
    for (gi = 0; gi < glist.length; gi++) {
        var g = glist[gi];
        if (!g || g.group !== "the_loai" || !g.slug || !g.name) continue;
        if (seenGenre[g.slug]) continue;
        seenGenre[g.slug] = true;
        genres.push({ title: g.name, input: g.slug, script: "genrecontent.js" });
    }
    if (genres.length === 0) {
        for (gi = 0; gi < glist.length; gi++) {
            var g2 = glist[gi];
            if (!g2 || g2.group === "trang_thai" || !g2.slug || !g2.name) continue;
            if (seenGenre[g2.slug]) continue;
            seenGenre[g2.slug] = true;
            genres.push({ title: g2.name, input: g2.slug, script: "genrecontent.js" });
            break;
        }
    }

    // Truyen tuong tu tu similar_stories.
    var suggests = [];
    var seenSug = {};
    seenSug[slug] = true;
    var sims = data.similar_stories || [];
    var si = 0;
    for (si = 0; si < sims.length; si++) {
        var sItem = storyToItem(sims[si]);
        if (!sItem) continue;
        var sSlug = extractSlug(sItem.link);
        if (!sSlug || seenSug[sSlug]) continue;
        seenSug[sSlug] = true;
        suggests.push(sItem);
        if (suggests.length >= 10) break;
    }

    var ongoing = !data.is_completed;
    var detailParts = [];
    if (data.total_chapters !== undefined && data.total_chapters !== null) {
        detailParts.push("Số chương: " + data.total_chapters);
    }
    if (data.status === "completed" || data.is_completed) detailParts.push("Trạng thái: Hoàn thành");
    else detailParts.push("Trạng thái: Còn tiếp");
    if (data.view_counts !== undefined && data.view_counts !== null) {
        detailParts.push("Lượt đọc: " + data.view_counts);
    }
    if (data.average_rating !== undefined && data.average_rating !== null) {
        detailParts.push("Đánh giá: " + data.average_rating);
    }
    if (data.last_chapter !== undefined && data.last_chapter !== null) {
        detailParts.push("Chương mới nhất: " + data.last_chapter);
    }

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author || "Không rõ",
        description: description,
        detail: detailParts.join("\n"),
        url: BASE_URL + "/truyen/" + slug,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: []
    });
}
