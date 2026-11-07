// home.js — cac tab trang chu cua NiACG.
//
// Quy tac 9: CHI TRA TAB TINH, KHONG FETCH. App chay tab dau tien ngay khi
// mo extension — fetch loi o do se chan ca trang chu. Moi tab co input la
// duong dan danh sach; app se goi book.js voi input do (xem book.js).
// Cac muc anh cua site (xem config.js): 本子, COS, CG, 套图, 日漫, 韩漫,
// 最新, 画廊, 漫画. Cac muc video (里番/3D/同人/视频列表) khong co trong
// extension comic nay (xem README).
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
