// home.js — Tab tinh trang chu Me Truyen Chu (khong fetch mang o home.js)
load('config.js');

function execute() {
    return Response.success([
        { title: "Truyện Hot", input: "/danh-sach/truyen-hot", script: "gen.js" },
        { title: "Mới Cập Nhật", input: "/danh-sach/truyen-moi", script: "gen.js" },
        { title: "Đã Hoàn Thành", input: "/danh-sach/truyen-full", script: "gen.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep", script: "gen.js" },
        { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen", script: "gen.js" },
        { title: "Đô Thị", input: "/the-loai/do-thi", script: "gen.js" }
    ]);
}
