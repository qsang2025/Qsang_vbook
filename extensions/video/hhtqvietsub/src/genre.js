// genre.js — danh sach chuyen muc cua hhtq.press (tab tinh, khong fetch).
// Site khong co trang the loai rieng; cac muc duoi day la duong dan danh
// sach that tren site (khao sat 2026-11-20): quoc gia, nam phat hanh,
// lich chieu theo thu va cac category WordPress gan tren trang chi tiet.
// Moi muc tro ve search.js voi input la duong dan do.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/last-update", script: "search.js" },
        { title: "Hoàn Thành", input: "/completed", script: "search.js" },
        { title: "Trung Quốc", input: "/country/trung-quoc", script: "search.js" },
        { title: "Năm 2026", input: "/release/2026", script: "search.js" },
        { title: "Năm 2024", input: "/release/2024", script: "search.js" },
        { title: "Năm 2023", input: "/release/2023", script: "search.js" },
        { title: "Năm 2022", input: "/release/2022", script: "search.js" },
        { title: "Thứ 2", input: "/thu-2", script: "search.js" },
        { title: "Thứ 3", input: "/thu-3", script: "search.js" },
        { title: "Thứ 4", input: "/thu-4", script: "search.js" },
        { title: "Thứ 5", input: "/thu-5", script: "search.js" },
        { title: "Thứ 6", input: "/thu-6", script: "search.js" },
        { title: "Thứ 7", input: "/thu-7", script: "search.js" },
        { title: "Chủ Nhật", input: "/chu-nhat", script: "search.js" }
    ]);
}
