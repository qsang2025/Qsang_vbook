load("config.js");

function execute() {
    var doc = fetchHtml(BASE_URL);
    if (!doc) return Response.error("Không thể tải danh sách thể loại từ " + BASE_URL);
    var data = [];
    var items = doc.select(".qk-cat-menu__item");
    for (var i = 0; i < items.size(); i++) {
        var e = items.get(i);
        data.push({
            title: e.text(),
            input: e.attr("href"),
            script: "gen.js"
        });
    }
    return Response.success(data);
}
