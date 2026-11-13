// home.js — cac tab tinh tren trang chu Storya (khong fetch).
//
// 4 tab tro ve gen.js voi input la duong dan danh sach:
//   /vi/stories              Moi cap nhat
//   /vi/stories?sort=reads   Doc nhieu
//   /vi/stories?sort=rating  Danh gia cao
//   /vi/stories?sort=title   A-Z
//
// Tai len: file config.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/vi/stories", script: "gen.js" },
        { title: "Đọc nhiều", input: BASE_URL + "/vi/stories?sort=reads", script: "gen.js" },
        { title: "Đánh giá cao", input: BASE_URL + "/vi/stories?sort=rating", script: "gen.js" },
        { title: "A–Z", input: BASE_URL + "/vi/stories?sort=title", script: "gen.js" }
    ]);
}
