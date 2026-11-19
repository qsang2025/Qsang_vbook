// genre.js — danh sach chuyen muc / board (template forum).
// Moi muc co input la duong dan chuyen muc; app se goi search.js voi input
// do giong nhu tab home.js.
// Doi SELECTOR_GENRE_LIST thanh selector danh sach board that cua site
// (vd. XenForo: ".node--forum"; xem extensions/forum/otofun de co mau that).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    var response = fetch(BASE_URL + "/the-loai");
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var genres = doc.select("SELECTOR_GENRE_LIST a").map(function (el) {
        return {
            title: el.text(),
            input: el.attr("href"),
            script: "search.js"
        };
    });

    return Response.success(genres);
}
