// home.js — cac tab chuyen muc chinh o trang chu extension.
// Tab tinh, KHONG fetch (quy tac nha: tab dau tien chay ngay khi mo
// extension, fetch loi o day se chan ca trang chu). Input la duong dan
// chuyen muc, search.js se tai danh sach bai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function execute() {
    return Response.success([
        { title: "Thời sự", input: "/thoi-su", script: "search.js" },
        { title: "Thế giới", input: "/the-gioi", script: "search.js" },
        { title: "Kinh doanh", input: "/kinh-doanh", script: "search.js" },
        { title: "Thể thao", input: "/the-thao", script: "search.js" },
        { title: "Giải trí", input: "/giai-tri", script: "search.js" },
        { title: "Số hóa", input: "/so-hoa", script: "search.js" },
        { title: "Sức khỏe", input: "/suc-khoe", script: "search.js" },
        { title: "Pháp luật", input: "/phap-luat", script: "search.js" }
    ]);
}
