// genre.js — Danh sach the loai (57 muc) tu modal the loai o trang chu.
// Trang chu SSR day du nen doc truc tiep, khong can API.
load("config.js");
load("rate-limit.js");

function execute() {
    var rr = blhFetchDoc(BASE_URL + "/");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var data = [];
    var links = doc.select(".modal-story-genre li a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var title = cleanText(a.text());
        var href = a.attr("href") || "";
        if (!title || !href) continue;
        data.push({ title: title, input: normalizeUrl(href), script: "source.js", host: BASE_URL });
    }
    if (data.length === 0) return Response.error("Không tìm thấy danh sách thể loại");
    return Response.success(data);
}
