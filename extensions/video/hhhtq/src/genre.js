// genre.js — danh sach the loai va bo loc cua HHHTQ (tab tinh, khong fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Huyền Huyễn", input: "/show/4-----------/", script: "search.js" },
        { title: "Cổ Trang", input: "/show/1-----------/", script: "search.js" },
        { title: "Viễn Tưởng", input: "/show/5-----------/", script: "search.js" },
        { title: "Hiện Đại", input: "/show/2-----------/", script: "search.js" },
        { title: "Đam Mỹ", input: "/show/3-----------/", script: "search.js" },
        { title: "Chiếu Rạp", input: "/show/6-----------/", script: "search.js" },
        { title: "Tu Tiên", input: "/show/4---Tu+ti%C3%AAn--------/", script: "search.js" },
        { title: "Võ Hiệp", input: "/show/1---+V%C3%B5+hi%E1%BB%87p+--------/", script: "search.js" },
        { title: "Phép Thuật", input: "/show/1---+Ph%C3%A9p+thu%E1%BA%ADt--------/", script: "search.js" },
        { title: "Hài Hước", input: "/show/1---H%C3%A0i+h%C6%B0%E1%BB%9Bc--------/", script: "search.js" },
        { title: "Năm 2026", input: "/show/4-----------2026/", script: "search.js" },
        { title: "Năm 2025", input: "/show/4-----------2025/", script: "search.js" },
        { title: "Năm 2024", input: "/show/4-----------2024/", script: "search.js" },
        { title: "Năm 2023", input: "/show/4-----------2023/", script: "search.js" }
    ]);
}
