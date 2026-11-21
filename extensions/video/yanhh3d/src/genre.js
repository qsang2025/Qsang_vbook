// genre.js — danh sach the loai cua YanHH3D (tab tinh, khong fetch).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Hoạt Hình 3D", input: "/hoat-hinh-3d", script: "search.js" },
        { title: "Hoạt Hình 4K", input: "/hoat-hinh-4k", script: "search.js" },
        { title: "Hoạt Hình 2D", input: "/hoat-hinh-2d", script: "search.js" },
        { title: "Hoạt Hình AI", input: "/hoat-hinh-ai", script: "search.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep", script: "search.js" },
        { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen", script: "search.js" },
        { title: "Kiếm Hiệp", input: "/the-loai/kiem-hiep", script: "search.js" },
        { title: "Cổ Trang", input: "/the-loai/co-trang", script: "search.js" },
        { title: "Hiện Đại", input: "/the-loai/hien-dai", script: "search.js" },
        { title: "Xuyên Không", input: "/the-loai/xuyen-khong", script: "search.js" },
        { title: "Trùng Sinh", input: "/the-loai/trung-sinh", script: "search.js" },
        { title: "Hài Hước", input: "/the-loai/hai-huoc", script: "search.js" },
        { title: "Phim Lẻ | OVA", input: "/phim-le", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh", script: "search.js" },
        { title: "Mới Cập Nhật", input: "/moi-cap-nhat", script: "search.js" }
    ]);
}
