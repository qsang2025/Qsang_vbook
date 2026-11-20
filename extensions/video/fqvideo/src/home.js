// home.js — cac tab trang chu FQ Video (chi tra tab tinh, KHONG fetch — quy tac 9).
// Moi tab tro ve search.js voi duong dan BXH / danh muc that cua cong video
// hongguoduanju.com (phim ngan, man kich / hoat hinh, hoat hinh AI).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Phim ngắn Hot", input: "/rank/hot-real-drama", script: "search.js" },
        { title: "Hoạt hình / Mạn kịch Hot", input: "/rank/hot-comic-drama", script: "search.js" },
        { title: "Hoạt hình AI Hot", input: "/rank/hot-ai-drama", script: "search.js" },
        { title: "BXH Tổng hợp", input: "/rank/hot-drama", script: "search.js" },
        { title: "Phim ngắn mới", input: "/category/real-drama", script: "search.js" },
        { title: "Mạn kịch / Hoạt hình", input: "/category/comic-drama", script: "search.js" },
        { title: "Hoạt hình AI", input: "/category/ai-drama", script: "search.js" }
    ]);
}
