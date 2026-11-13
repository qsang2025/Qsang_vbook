// home.js — Tab tinh (khong fetch, theo quy tac 9).
// Cac tab tro ve gen.js voi input la URL archive cua site.
// "Moi Cap Nhat" mac dinh sap xep moi nhat; "Xem Nhieu" dung ?sort=view
// cua site (kiem chung tu VM 2026-11-13: ca 3 URL tra 200, 10 muc/trang,
// co phan trang /page/N/).
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "https://ztruyen.vn/dang-cap-nhat/", script: "gen.js" },
        { title: "Hoàn Thành", input: "https://ztruyen.vn/hoan-thanh/", script: "gen.js" },
        { title: "Xem Nhiều", input: "https://ztruyen.vn/dang-cap-nhat/?sort=view", script: "gen.js" }
    ]);
}
