// home.js — 3 tab tinh, khong fetch (AGENTS.md muc 6.9: home.js chi tra
// tab tinh). Moi tab tro ve top.js voi sort tuong ung cua
// most_reading.php (3 sort nay hien ngay tren trang top cua site:
// "Sort by: Mới - Đọc - Download - Bìa").
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        {title: "Mới cập nhật", input: BASE_URL + "/most_reading.php?sort=last_update_date", script: "top.js"},
        {title: "Đọc nhiều", input: BASE_URL + "/most_reading.php?sort=page_view", script: "top.js"},
        {title: "Tải nhiều", input: BASE_URL + "/most_reading.php?sort=download", script: "top.js"}
    ]);
}
