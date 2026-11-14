// detail.js — Chi tiet truyen: API /novel/detail/<articleid>.
// fullflag: 0 = dang ra, 1 = hoan thanh (kiem chung 2026-11-14: truyen
// co chuong cuoi "大結局" thi fullflag = 1). Tag trong tag_list dan toi
// tagcontent.js theo keyword_id.
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = normalizeUrl(url);
    var id = parseArticleId(url);
    if (!id) return Response.error("Không đọc được articleid từ URL");

    var r = fetchApi("/novel/detail/" + id, true);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200 || !json.data) return Response.error("Tải chi tiết thất bại");

    var d = json.data;
    var tags = [], tagList = d.tag_list;
    if (tagList && tagList.length) {
        for (var i = 0; i < tagList.length; i++) {
            var t = tagList[i];
            if (!t || !t.keyword_id) continue;
            tags.push({
                title: t.keyword || "",
                input: String(t.keyword_id),
                script: "tagcontent.js"
            });
        }
    }

    var detailText = "";
    if (d.lastchapter) detailText = "Chương mới nhất: " + d.lastchapter;

    return Response.success({
        name: d.articlename || "",
        cover: coverUrl(id),
        host: BASE_URL,
        author: d.author || "",
        description: d.intro || "",
        detail: detailText,
        ongoing: d.fullflag === "0" || d.fullflag === 0,
        tags: tags,
        genres: [],
        suggests: []
    });
}
