// home.js — cac tab trang chu Hoạt Hình 3D (tab tinh, KHONG fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/moi-cap-nhat", script: "search.js" },
        { title: "Top Xem Nhiều", input: "/top-xem-nhieu", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh", script: "search.js" },
        { title: "Lịch Chiếu", input: "/lich-chieu", script: "search.js" }
    ]);
}
