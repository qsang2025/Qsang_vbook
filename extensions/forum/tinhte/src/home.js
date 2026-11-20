// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
//
// - "Smartphone - Tablet": board lon nhat (973K thread, 20M bai),
//   /forums/smartphone-tablet.796/.
// - "Chuyen ngoai le": board tro chuyen chung dong thu 2 (358K thread),
//   /forums/chuyen-ngoai-le.802/.
// Moi tab tro ve list.js voi input la duong dan board.
// Khong co tab "Moi nhat" toan dien dan: /find-new/threads cua Tinhte
// chi tra 303 vong lap doi timestamp (can cookie tt_session), khong
// phai danh sach on dinh — da thu 20/11, bo.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Smartphone - Tablet", input: "/forums/smartphone-tablet.796/", script: "list.js" },
        { title: "Chuyện ngoài lề", input: "/forums/chuyen-ngoai-le.802/", script: "list.js" }
    ]);
}
