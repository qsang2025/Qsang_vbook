// home.js — cac tab trang chu cua 思兔閱讀 (sto9.com).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan danh sach. Ba tab dau: truyen hot, moi cap nhat,
// hoan thanh; sau do cac the loai lon.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Truyện hot", input: "/novels/hot", script: "book.js" },
        { title: "Mới cập nhật", input: "/last", script: "book.js" },
        { title: "Hoàn thành", input: "/novels/full", script: "book.js" },
        { title: "玄幻奇幻", input: "/novels/class/1_1.html", script: "book.js" },
        { title: "武俠仙俠", input: "/novels/class/2_1.html", script: "book.js" },
        { title: "現代都市", input: "/novels/class/3_1.html", script: "book.js" },
        { title: "遊戲競技", input: "/novels/class/6_1.html", script: "book.js" },
        { title: "科幻小說", input: "/novels/class/5_1.html", script: "book.js" },
        { title: "言情小說", input: "/novels/class/8_1.html", script: "book.js" }
    ]);
}
