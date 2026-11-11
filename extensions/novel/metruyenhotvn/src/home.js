// home.js — Cac tab trang chu Metruyenhotvn (metruyenhotvn.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Moi tab co input la duong dan chuyen muc; app se goi book.js voi input do.
// Cac muc lay tu menu trang chu (kiem chung live 2026-11-11):
//   /danh-sach/truyen-hot/          "Truyện hot"
//   /danh-sach/truyen-moi-cap-nhat/ "Mới cập nhật"
//   /danh-sach/truyen-full/         "Truyện full"
//   /danh-sach/ngon-tinh-hay/       "Ngôn Tình Hay"
//   /danh-sach/dam-my-hay/          "Đam Mỹ Hay"
//   /danh-sach/tien-hiep-hay/       "Tiên Hiệp Hay"
//   /danh-sach/kiem-hiep-hay/       "Kiếm Hiệp Hay"
function execute() {
    return Response.success([
        { title: "Truyện hot", input: "/danh-sach/truyen-hot", script: "book.js" },
        { title: "Mới cập nhật", input: "/danh-sach/truyen-moi-cap-nhat", script: "book.js" },
        { title: "Truyện full", input: "/danh-sach/truyen-full", script: "book.js" },
        { title: "Ngôn Tình Hay", input: "/danh-sach/ngon-tinh-hay", script: "book.js" },
        { title: "Đam Mỹ Hay", input: "/danh-sach/dam-my-hay", script: "book.js" },
        { title: "Tiên Hiệp Hay", input: "/danh-sach/tien-hiep-hay", script: "book.js" },
        { title: "Kiếm Hiệp Hay", input: "/danh-sach/kiem-hiep-hay", script: "book.js" }
    ]);
}
