// home.js — cac tab trang chu (chi tra tab tinh, KHONG fetch — quy tac 9).
// App chay tab dau tien ngay khi mo extension; tab tro ve search.js voi
// input la duong dan danh sach cua API phimapi.com (danh-sach/hoat-hinh,
// khong loc country — kho tong hop; category la slug the loai that cua site).
// Khong can nap file nao vi home.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/v1/api/danh-sach/hoat-hinh", script: "search.js" },
        { title: "Hành Động", input: "/v1/api/danh-sach/hoat-hinh?category=hanh-dong", script: "search.js" },
        { title: "Viễn Tưởng", input: "/v1/api/danh-sach/hoat-hinh?category=vien-tuong", script: "search.js" },
        { title: "Cổ Trang", input: "/v1/api/danh-sach/hoat-hinh?category=co-trang", script: "search.js" },
        { title: "Hài Hước", input: "/v1/api/danh-sach/hoat-hinh?category=hai-huoc", script: "search.js" },
        { title: "Phiêu Lưu", input: "/v1/api/danh-sach/hoat-hinh?category=phieu-luu", script: "search.js" }
    ]);
}
