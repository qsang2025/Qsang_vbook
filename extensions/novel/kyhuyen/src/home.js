// home.js — Cac tab trang chu Ky Huyen (kyhuyen.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Moi tab tro ve gen.js voi input la duong dan danh sach cua site
// (kiem chung live 2026-11-18): /tim-kiem (moi cap nhat), t=1 (truyen
// convert), t=2 (truyen dich), t=4 (AI dich), st=20 (da hoan thanh).
function execute() {
    return Response.success([
        { title: "Truyện mới cập nhật", input: "/tim-kiem", script: "gen.js" },
        { title: "Truyện convert", input: "/tim-kiem?t=1", script: "gen.js" },
        { title: "Truyện dịch", input: "/tim-kiem?t=2", script: "gen.js" },
        { title: "AI dịch", input: "/tim-kiem?t=4", script: "gen.js" },
        { title: "Truyện đã hoàn thành", input: "/tim-kiem?st=20", script: "gen.js" }
    ]);
}
