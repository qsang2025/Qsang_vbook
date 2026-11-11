// home.js — Cac tab trang chu Metruyenchu.org (metruyenchu.org).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Moi tab co input la duong dan chuyen muc; app se goi book.js voi input do.
// Cac muc lay tu menu trang chu (kiem chung live 2026-11-11):
//   /danh-sach/truyen-hot/       "Truyện hot"
//   /danh-sach/truyen-moi/       "Mới cập nhật"
//   /danh-sach/truyen-full/      "Truyện full"
//   /danh-sach/truyen-moi-dang/  "Truyện mới đăng"
function execute() {
    return Response.success([
        { title: "Truyện hot", input: "/danh-sach/truyen-hot", script: "book.js" },
        { title: "Mới cập nhật", input: "/danh-sach/truyen-moi", script: "book.js" },
        { title: "Truyện full", input: "/danh-sach/truyen-full", script: "book.js" },
        { title: "Truyện mới đăng", input: "/danh-sach/truyen-moi-dang", script: "book.js" }
    ]);
}
