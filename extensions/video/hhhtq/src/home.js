// home.js — cac tab trang chu HHHTQ (tab tinh, KHONG fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/show/1-----------/", script: "search.js" },
        { title: "Huyền Huyễn", input: "/show/4-----------/", script: "search.js" },
        { title: "Cổ Trang", input: "/show/1-----------/", script: "search.js" },
        { title: "Viễn Tưởng", input: "/show/5-----------/", script: "search.js" },
        { title: "Hiện Đại", input: "/show/2-----------/", script: "search.js" },
        { title: "Đam Mỹ", input: "/show/3-----------/", script: "search.js" },
        { title: "Chiếu Rạp", input: "/show/6-----------/", script: "search.js" }
    ]);
}
