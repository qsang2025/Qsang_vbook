// genre.js — danh sach chuyen muc VnExpress.
// Danh sach tinh theo menu chinh cua site (khao sat live 2026-11-20),
// khong fetch de tranh loi chan trang the loai. Input la duong dan
// chuyen muc, search.js se tai danh sach bai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function execute() {
    return Response.success([
        { title: "Thời sự", input: "/thoi-su", script: "search.js" },
        { title: "Thế giới", input: "/the-gioi", script: "search.js" },
        { title: "Kinh doanh", input: "/kinh-doanh", script: "search.js" },
        { title: "Giải trí", input: "/giai-tri", script: "search.js" },
        { title: "Thể thao", input: "/the-thao", script: "search.js" },
        { title: "Pháp luật", input: "/phap-luat", script: "search.js" },
        { title: "Giáo dục", input: "/giao-duc", script: "search.js" },
        { title: "Sức khỏe", input: "/suc-khoe", script: "search.js" },
        { title: "Đời sống", input: "/doi-song", script: "search.js" },
        { title: "Du lịch", input: "/du-lich", script: "search.js" },
        { title: "Khoa học", input: "/khoa-hoc", script: "search.js" },
        { title: "Số hóa", input: "/so-hoa", script: "search.js" },
        { title: "Xe", input: "/xe", script: "search.js" },
        { title: "Ý kiến", input: "/y-kien", script: "search.js" },
        { title: "Tâm sự", input: "/tam-su", script: "search.js" },
        { title: "Thư giãn", input: "/thu-gian", script: "search.js" }
    ]);
}
