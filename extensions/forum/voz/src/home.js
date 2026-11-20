// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
//
// - "Moi nhat": bai viet moi tren toan dien dan (/whats-new/posts/).
// - "Chia se kien thuc": board dong nhat (124,4K bai), /s/chia-se-kien-thuc.104/.
// Moi tab tro ve list.js voi input la duong dan danh sach.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/whats-new/posts/", script: "list.js" },
        { title: "Chuyện trò linh tinh", input: "/f/chuyen-tro-linh-tinhtm.17/", script: "list.js" }
    ]);
}
