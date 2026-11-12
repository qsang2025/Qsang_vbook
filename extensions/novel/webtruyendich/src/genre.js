load('config.js');

function execute() {
    var genres = [
        { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen", script: "gen.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep", script: "gen.js" },
        { title: "Đô Thị", input: "/the-loai/do-thi", script: "gen.js" },
        { title: "Kiếm Hiệp", input: "/the-loai/kiem-hiep", script: "gen.js" },
        { title: "Khoa Học Viễn Tưởng", input: "/the-loai/khoa-hoc-vien-tuong", script: "gen.js" },
        { title: "Đồng Nhân", input: "/the-loai/dong-nhan", script: "gen.js" },
        { title: "Quân Sự", input: "/the-loai/quan-su", script: "gen.js" },
        { title: "Lịch Sử", input: "/the-loai/lich-su", script: "gen.js" },
        { title: "Game", input: "/the-loai/game", script: "gen.js" },
        { title: "Võng Du", input: "/the-loai/vong-du", script: "gen.js" },
        { title: "Kỳ Huyễn", input: "/the-loai/ky-huyen", script: "gen.js" },
        { title: "Linh Dị", input: "/the-loai/linh-di", script: "gen.js" }
    ];
    return Response.success(genres);
}
