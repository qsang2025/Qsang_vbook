// genre.js — The loai / sap xep LilyHub (chi tra danh sach tinh).
// Site khong co trang the loai rieng; cac muc deu la che do sap xep / loc
// cua gen.js. Khong co tab "Sap ra mat": nhung truyen do chua co chuong
// nen khong doc duoc trong VBook.

function execute() {
    return Response.success([
        { title: "Tất cả", input: "latest", script: "gen.js" },
        { title: "Hoàn thành", input: "completed", script: "gen.js" },
        { title: "Đang cập nhật", input: "ongoing", script: "gen.js" },
        { title: "Bách Hợp", input: "cat:Bách Hợp", script: "gen.js" },
        { title: "Nhiều chương nhất", input: "most-chapters", script: "gen.js" },
        { title: "Được yêu thích nhất", input: "most-votes", script: "gen.js" },
        { title: "Xem nhiều nhất", input: "most-views", script: "gen.js" },
        { title: "Mới cập nhật", input: "recently-updated", script: "gen.js" }
    ]);
}
