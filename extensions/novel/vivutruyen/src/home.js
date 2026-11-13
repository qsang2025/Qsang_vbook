// home.js — Tab tinh (khong fetch, theo quy tac 9).
// Tab tro ve gen.js voi input la URL archive cua site (kiem chung
// 2026-11-14: /de-cu/, /xem-nhieu/, /moi-cap-nhat/, /moi-nhat/,
// /full/ deu tra 200 tu VM).
load('config.js');
function execute() {
    return Response.success([
        { title: "Đề Cử", input: BASE_URL + "/de-cu/", script: "gen.js" },
        { title: "Xem Nhiều", input: BASE_URL + "/xem-nhieu/", script: "gen.js" },
        { title: "Mới Cập Nhật", input: BASE_URL + "/moi-cap-nhat/", script: "gen.js" },
        { title: "Mới Nhất", input: BASE_URL + "/moi-nhat/", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/full/", script: "gen.js" }
    ]);
}
