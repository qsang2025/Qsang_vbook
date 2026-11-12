load('config.js');

function execute() {
    var categories = [
        { title: "Truyện Mới Cập Nhật", input: "/tim-truyen?sort=update", script: "gen.js" },
        { title: "Xem Nhiều Tuần", input: "/tim-truyen?sort=view-weekly", script: "gen.js" },
        { title: "Xem Nhiều Tháng", input: "/tim-truyen?sort=view-monthly", script: "gen.js" },
        { title: "Đề Cử Tuần", input: "/tim-truyen?sort=push-weekly", script: "gen.js" },
        { title: "Đề Cử Tháng", input: "/tim-truyen?sort=push-monthly", script: "gen.js" },
        { title: "Bán Chạy", input: "/xep-hang/ban-chay", script: "gen.js" },
        { title: "Bảng Xếp Hạng Đọc", input: "/xep-hang/chi-so-doc", script: "gen.js" }
    ];
    return Response.success(categories);
}
