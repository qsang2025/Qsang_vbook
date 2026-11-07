// genre.js — danh sach muc (the loai) cua NiACG.
//
// Site khong co trang /the-loai rieng; cac muc la classid co dinh cua
// EmpireCMS (xem config.js), nen tra ve danh sach tinh. Moi muc tro ve
// book.js voi input la duong dan danh sach cua muc do.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "本子", input: "/listinfo-3-0.html", script: "book.js" },
        { title: "COS", input: "/listinfo-1-0.html", script: "book.js" },
        { title: "CG", input: "/listinfo-2-0.html", script: "book.js" },
        { title: "套图", input: "/listinfo-4-0.html", script: "book.js" },
        { title: "日漫", input: "/listinfo-14-0.html", script: "book.js" },
        { title: "韩漫", input: "/listinfo-15-0.html", script: "book.js" },
        { title: "最新", input: "/listinfo-9-0.html", script: "book.js" },
        { title: "画廊", input: "/listinfo-22-0.html", script: "book.js" },
        { title: "漫画", input: "/listinfo-12-0.html", script: "book.js" }
    ]);
}
