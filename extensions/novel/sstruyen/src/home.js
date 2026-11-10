// home.js — Cac tab trang chu SS Truyen (sstruyen.net).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Moi tab co input la duong dan chuyen muc; app se goi book.js voi input do.
function execute() {
    return Response.success([
        { title: "Truyện mới", input: "/truyen-moi", script: "book.js" },
        { title: "Truyện hot", input: "/truyen-hot", script: "book.js" },
        { title: "Truyện hoàn thành", input: "/truyen-hoan-thanh", script: "book.js" },
        { title: "Tất cả truyện", input: "/truyen", script: "book.js" }
    ]);
}
