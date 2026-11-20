// genre.js — danh sach board (chuyen muc) cua VOZ Forum.
//
// Lay tu trang chu / (VOZ hien danh sach node o "Dai sanh"): moi
// .node--forum la mot board. Moi muc tro ve list.js voi input la
// duong dan board day du (/s/<slug>.<id>/).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    var response = fetch(BASE_URL + "/");
    if (!response.ok) return Response.error("Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch board (HTTP " + response.status + ")");
    var doc = response.html();

    var genres = doc.select(".node--forum").map(function (el) {
        var link = el.select(".node-title a");
        return {
            title: link.text(),
            input: link.attr("href"),
            script: "list.js",
            description: el.select(".node-description").text()
        };
    });

    return Response.success(genres);
}
