// home.js — Tab tinh (khong fetch, theo quy tac 9).
// Tab tro ve gen.js voi input la URL archive cua site.
// "Moi Cap Nhat" la trang tong /truyen/ (22 muc/trang, co phan trang
// /page/N/ — kiem chung tu VM 2026-11-13). Site khong co archive trang
// thai rieng dang /hoan-thanh/ nhu kieu WordPress truyenbiz, nen chi
// giu 1 tab (khong doan URL chua kiem chung).
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "https://truyenchu.net/truyen/", script: "gen.js" }
    ]);
}
