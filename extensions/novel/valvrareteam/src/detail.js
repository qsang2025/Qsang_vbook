// detail.js — Chi tiet truyen: GET /api/novels/<id> tra {novel, modules}.
// Ten/tac gia/mo ta/anh bia/trang thai/the loai lay tu novel; so chuong
// dem tu modules. The loai nguoi lon "Incest" / "Netorare" khong tao
// chip duyet (xem ghi chu trong file config.js).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var novelId = extractNovelId(url);
    if (!novelId) return Response.error("URL truyện không hợp lệ");

    var r = fetchApiJson("/api/novels/" + novelId);
    if (r.error) return Response.error(r.error);
    var data = r.data || {};
    var novel = data.novel;
    if (!novel) return Response.error("Không tìm thấy truyện");

    var genres = [];
    var rawGenres = novel.genres || [];
    for (var gi = 0; gi < rawGenres.length; gi++) {
        var g = rawGenres[gi];
        if (isBlockedGenre(g)) continue;
        genres.push({
            title: g,
            input: BASE_URL + "/api/novels?limit=100#genre=" + encodeURIComponent(g),
            script: "genrecontent.js"
        });
    }

    var totalChaps = 0;
    var modules = data.modules || [];
    for (var mi = 0; mi < modules.length; mi++) {
        totalChaps += (modules[mi].chapters || []).length;
    }

    var detailTxt = "Số chương: " + totalChaps;
    detailTxt += "\nTrạng thái: " + mapStatus(novel.status);
    if (novel.alternativeTitles && novel.alternativeTitles.length > 0) {
        detailTxt += "\nTên khác: " + novel.alternativeTitles[0];
    }
    if (novel.illustrator) {
        detailTxt += "\nHọa sĩ: " + novel.illustrator;
    }
    if (novel.views && novel.views.total) {
        detailTxt += "\nLượt xem: " + novel.views.total;
    }

    return Response.success({
        name: novel.title || "",
        author: novel.author || "",
        cover: novel.illustration || "",
        description: stripHtml(novel.description || ""),
        detail: detailTxt,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: novel.status === "Ongoing",
        genres: genres,
        suggests: [{ title: "Gợi ý", input: url, script: "suggest.js" }],
        comments: [{ title: "Bình luận", input: novelId, script: "comment.js" }]
    });
}
