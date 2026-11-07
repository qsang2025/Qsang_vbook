// genre.js — danh sach muc (the loai) cua NiACG.
//
// Site khong co trang /the-loai rieng; cac muc la classid co dinh cua
// EmpireCMS (xem config.js), nen tra ve danh sach tinh. Moi muc tro ve
// book.js voi input la duong dan danh sach cua muc do. Them 15 tag nong
// (lay tu ban Antigravity, da bo 2 muc video 里番/3D动漫 vi extension
// comic khong phat duoc video) — cac tag tro ve book.js voi /tags-... .
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
        { title: "漫画", input: "/listinfo-12-0.html", script: "book.js" },
        { title: "巨乳", input: "/tags-巨乳-0.html", script: "book.js" },
        { title: "双马尾", input: "/tags-双马尾-0.html", script: "book.js" },
        { title: "黑丝", input: "/tags-黑丝-0.html", script: "book.js" },
        { title: "女仆", input: "/tags-女仆-0.html", script: "book.js" },
        { title: "纯爱", input: "/tags-纯爱-0.html", script: "book.js" },
        { title: "萝莉", input: "/tags-萝莉-0.html", script: "book.js" },
        { title: "调教", input: "/tags-调教-0.html", script: "book.js" },
        { title: "御姐", input: "/tags-御姐-0.html", script: "book.js" },
        { title: "全彩", input: "/tags-全彩-0.html", script: "book.js" },
        { title: "无修", input: "/tags-无修-0.html", script: "book.js" },
        { title: "连载", input: "/tags-连载-0.html", script: "book.js" },
        { title: "完结", input: "/tags-完结-0.html", script: "book.js" },
        { title: "原神", input: "/tags-原神-0.html", script: "book.js" },
        { title: "碧蓝航线", input: "/tags-碧蓝航线-0.html", script: "book.js" },
        { title: "崩坏", input: "/tags-崩坏-0.html", script: "book.js" }
    ]);
}
