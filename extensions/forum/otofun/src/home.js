// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
//
// - "Mới nhất": bai viet moi tren toan dien dan (/whats-new/posts/).
// - "Quán cafe": board tro chuyen chung, nhieu bai nhat (/forums/quan-cafe-otofun.77/).
// Moi tab tro ve search.js voi input la duong dan danh sach.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới nhất", input: "/whats-new/posts/", script: "search.js" },
        { title: "Quán cafe", input: "/forums/quan-cafe-otofun.77/", script: "search.js" }
    ]);
}
