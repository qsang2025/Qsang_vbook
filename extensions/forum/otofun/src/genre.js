// genre.js — danh sach board (chuyen muc) cua Otofun.
//
// Lay tu trang /forums/: moi node .node--forum la mot board (62 board).
// Moi muc tro ve search.js voi input la duong dan board day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    var response = fetch(BASE_URL + "/forums/");
    if (!response.ok) return Response.error("Không tải được danh sách board (HTTP " + response.status + ")");
    var doc = response.html();

    var genres = doc.select(".node--forum").map(function (el) {
        var link = el.select(".node-title a");
        return {
            title: link.text(),
            input: link.attr("href"),
            script: "search.js",
            description: el.select(".node-description").text()
        };
    });

    return Response.success(genres);
}
