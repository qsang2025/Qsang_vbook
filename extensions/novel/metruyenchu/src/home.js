// home.js — Tab tinh trang chu Me Truyen Chu (khong fetch mang o home.js)
// "Moi Cap Nhat" tro ve trang chu "/" (gen.js doc danh sach .itemupdate
// o do): /danh-sach/truyen-moi tra HTTP 404, kiem chung bang curl
// 2026-11-08. Trang chu khong co phan trang nen tab nay chi co 1 trang.
load('config.js');

function execute() {
    return Response.success([
        { title: "Truyện Hot", input: "/danh-sach/truyen-hot", script: "gen.js" },
        { title: "Mới Cập Nhật", input: "/", script: "gen.js" },
        { title: "Đã Hoàn Thành", input: "/danh-sach/truyen-full", script: "gen.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep", script: "gen.js" },
        { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen", script: "gen.js" },
        { title: "Đô Thị", input: "/the-loai/do-thi", script: "gen.js" }
    ]);
}
