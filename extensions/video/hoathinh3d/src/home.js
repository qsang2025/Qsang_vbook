// home.js — cac tab trang chu (chi tra tab tinh, KHONG fetch — quy tac 9).
// App chay tab dau tien ngay khi mo extension; tab tro ve search.js voi
// input la duong dan danh sach cua API phimapi.com (danh-sach/hoat-hinh
// loc dung donghua Trung Quoc; category la slug the loai that cua site).
// Khong can load config.js vi home.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật 3D", input: "/v1/api/danh-sach/hoat-hinh?country=trung-quoc", script: "search.js" },
        { title: "Tu Tiên & Huyền Huyễn", input: "/v1/api/danh-sach/hoat-hinh?country=trung-quoc&category=than-thoai", script: "search.js" },
        { title: "Võ Thuật & Kiếm Hiệp", input: "/v1/api/danh-sach/hoat-hinh?country=trung-quoc&category=vo-thuat", script: "search.js" },
        { title: "Khoa Huyễn Dị Giới", input: "/v1/api/danh-sach/hoat-hinh?country=trung-quoc&category=vien-tuong", script: "search.js" },
        { title: "Cổ Trang & Xuyên Không", input: "/v1/api/danh-sach/hoat-hinh?country=trung-quoc&category=co-trang", script: "search.js" }
    ]);
}
