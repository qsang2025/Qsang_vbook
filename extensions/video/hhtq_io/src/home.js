// home.js — cac tab danh muc tren man hinh chinh cua HHTQ IO (hhtq.io).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "Khám Phá", input: "/", script: "search.js" },
        { title: "Tập Mới Hôm Nay", input: "/?today=1", script: "search.js" },
        { title: "Đang Cập Nhật", input: "/?status=ongoing", script: "search.js" },
        { title: "Hoàn Thành", input: "/?status=completed", script: "search.js" }
    ]);
}
