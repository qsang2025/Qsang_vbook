// home.js — Tab tinh (khong fetch, theo §6.9).
// Cac tab tro ve gen.js voi input la ten collection cua API.
// BO tab "Truyện VIP" cua base: chi doc noi dung mien phi (xem helper.js).
load('config.js');
function execute() {
    return Response.success([
        { title: "Cập Nhật", input: "new-books", script: "gen.js" },
        { title: "Miễn Phí", input: "hot-free-books", script: "gen.js" },
        { title: "Hoàn Thành", input: "full-books", script: "gen.js" }
    ]);
}
