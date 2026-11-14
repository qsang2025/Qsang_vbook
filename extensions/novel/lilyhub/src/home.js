// home.js — Trang chu LilyHub (chi tra tab tinh, khong fetch).
// App chay tab dau tien ngay khi mo extension — fetch loi o day se chan
// ca trang chu, nen home chi tra danh sach tab tinh.

function execute() {
    return Response.success([
        { title: "Truyện mới", input: "latest", script: "gen.js" },
        { title: "Hoàn thành", input: "completed", script: "gen.js" },
        { title: "Đang cập nhật", input: "ongoing", script: "gen.js" },
        { title: "Bách Hợp", input: "cat:Bách Hợp", script: "gen.js" },
        { title: "Nhiều chương nhất", input: "most-chapters", script: "gen.js" }
    ]);
}
