// genre.js — danh sach the loai (chi tra muc tinh, khong fetch).
//
// Site khong co he the loai that: chi co 2 tag index (全本同人 / 连载同人)
// va bang xep hang. Tra ve 2 muc do, tro ve gen.js (giong tab home).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "全本同人", input: BASE_URL + "/tags-150-0.html", script: "gen.js" },
        { title: "连载同人", input: BASE_URL + "/tags-151-0.html", script: "gen.js" },
        { title: "高分榜单", input: BASE_URL + "/rating/", script: "gen.js" },
        { title: "全部同人", input: BASE_URL + "/tongren/", script: "gen.js" }
    ]);
}
