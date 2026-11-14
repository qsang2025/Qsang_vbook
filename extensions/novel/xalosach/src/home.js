// home.js — Cac tab trang chu Xa Lo Sach (xalosach.com).
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Cac tab tro ve gen.js voi input la URL danh sach cua site.

load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/danhsach/index.html?status=0&sort=2", script: "gen.js" },
        { title: "Đang hot", input: "/danhsach/index.html?status=0&sort=1", script: "gen.js" },
        { title: "Mới hoàn thành", input: "/danhsach/index.html?status=2&sort=2", script: "gen.js" }
    ]);
}
