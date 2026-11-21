// home.js — cac tab trang chu HHTQ 4K (tab tinh, KHONG fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/moi-cap-nhat", script: "search.js" },
        { title: "Lịch Chiếu Phim", input: "/lich-chieu-phim", script: "search.js" },
        { title: "Đô Thị", input: "/do-thi", script: "search.js" },
        { title: "Hiện Đại", input: "/hien-dai", script: "search.js" },
        { title: "Tu Tiên", input: "/tu-tien", script: "search.js" }
    ]);
}
