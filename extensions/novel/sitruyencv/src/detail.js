// detail.js — Chi tiet truyen qua GET /api/stories/{id}.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var id = storyIdFromUrl(url);
    if (!id) return Response.error("Link truyện không hợp lệ");
    var rr = stvFetchJson(API_URL + "/api/stories/" + id);
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.data) return Response.error("Không đọc được thông tin truyện");
    var e = json.data;

    var author = "";
    if (e.author && e.author.name) author = e.author.name;

    var cat = categoryText(e.categories);
    var chapters = e.total_chapters != null ? e.total_chapters : 0;
    var views = e.total_views != null ? e.total_views : 0;
    var status = (e.status || "").toLowerCase();
    var ongoing = status !== "completed" && status !== "complete";

    var detailParts = [];
    if (cat) detailParts.push(cat);
    if (e.story_type) detailParts.push(e.story_type);
    detailParts.push(chapters + " chương");
    detailParts.push(views + " lượt xem");
    if (e.status) detailParts.push(e.status);

    var genres = [];
    var suggests = [];
    if (e.categories) {
        for (var i = 0; i < e.categories.length; i++) {
            var c = e.categories[i];
            if (!c || !c.id || !c.name) continue;
            genres.push({ title: c.name, input: BASE_URL + "/category/" + c.id, script: "gen.js" });
            suggests.push({ title: "Cùng thể loại: " + c.name, input: BASE_URL + "/category/" + c.id, script: "gen.js" });
        }
    }

    return Response.success({
        name: e.title || "",
        author: author,
        cover: e.cover_image_url || "",
        description: e.description || "",
        detail: detailParts.join("<br>"),
        url: BASE_URL + "/story/" + id,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
