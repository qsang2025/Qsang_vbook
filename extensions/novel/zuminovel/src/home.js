// home.js — Zumi Novel: 6 tab tinh, khong fetch (quy tac 9).
load('config.js');

function execute() {
    return Response.success([
        {title: "Mới Cập Nhật", input: BASE_URL + "/list?sort=updated", script: "gen.js"},
        {title: "Xem Nhiều (Thịnh Hành)", input: BASE_URL + "/list?sort=views", script: "gen.js"},
        {title: "Theo Dõi Nhiều", input: BASE_URL + "/list?sort=followers", script: "gen.js"},
        {title: "Yêu Thích (Lưu Nhiều)", input: BASE_URL + "/list?sort=saves", script: "gen.js"},
        {title: "Truyện Mới", input: BASE_URL + "/list?sort=newest", script: "gen.js"},
        {title: "Đã Hoàn Thành", input: BASE_URL + "/list?status=completed", script: "gen.js"}
    ]);
}
