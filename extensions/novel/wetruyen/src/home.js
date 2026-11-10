// home.js — Cac tab trang chu Wetruyen (wetruyen.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Moi tab co input la duong dan chuyen muc; app se goi book.js voi input do.
// Cac muc lay tu menu trang chu (kiem chung live 2026-11-11):
//   /truyen-hot/            "Truyện hot"
//   /truyen-moi-cap-nhat/   "Truyện mới cập nhật"
//   /truyen-full/           "Truyện đã hoàn thành"
//   /truyen-moi-dang/       "Truyện mới đăng"
function execute() {
    return Response.success([
        { title: "Truyện hot", input: "/truyen-hot/", script: "book.js" },
        { title: "Mới cập nhật", input: "/truyen-moi-cap-nhat/", script: "book.js" },
        { title: "Truyện full", input: "/truyen-full/", script: "book.js" },
        { title: "Truyện mới đăng", input: "/truyen-moi-dang/", script: "book.js" }
    ]);
}
