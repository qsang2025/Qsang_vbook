// genre.js — Danh sach the loai tu /girl/ + /boy/ + /tongren/.
// Moi trang co 1 <li class="sublist"> chua cac link the loai.
load("config.js");
load("rate-limit.js");

function execute() {
    var sections = [
        { url: BASE_URL + "/girl/", prefix: "女频 - " },
        { url: BASE_URL + "/boy/", prefix: "男频 - " },
        { url: BASE_URL + "/tongren/", prefix: "同人 - " }
    ];
    var seen = {};
    var genres = [];
    for (var s = 0; s < sections.length; s++) {
        var rr = ttlFetchDoc(sections[s].url);
        if (rr.error) return Response.error(rr.error);
        var links = rr.doc.select(".sublist a");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = normalizeUrl(a.attr("href") || "");
            var title = cleanText(a.text());
            if (!href || !title || seen[href]) continue;
            seen[href] = true;
            genres.push({ title: sections[s].prefix + title, input: href, script: "genrecontent.js" });
        }
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại: " + BASE_URL + "/girl/");
    return Response.success(genres);
}
