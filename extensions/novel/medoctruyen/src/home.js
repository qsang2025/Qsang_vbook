// home.js — Cac tab trang chu Me Doc Truyen (medoctruyen.vn).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Moi tab tro ve gen.js voi input la duong dan danh sach cua site
// (kiem chung live 2026-11-12): /browse?sort=new (moi len ke),
// /browse?sort=updated (dang cap nhat), /browse?status=completed
// (hoan thanh), /bang-xep-hang/de-cu, /luot-doc, /theo-doi.
function execute() {
    return Response.success([
        { title: "Mới lên kệ", input: "/browse?sort=new", script: "gen.js" },
        { title: "Đang cập nhật", input: "/browse?sort=updated", script: "gen.js" },
        { title: "Hoàn thành", input: "/browse?status=completed", script: "gen.js" },
        { title: "Đề cử", input: "/bang-xep-hang/de-cu", script: "gen.js" },
        { title: "Lượt đọc", input: "/bang-xep-hang/luot-doc", script: "gen.js" },
        { title: "Theo dõi", input: "/bang-xep-hang/theo-doi", script: "gen.js" }
    ]);
}
