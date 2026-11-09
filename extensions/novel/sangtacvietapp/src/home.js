// home.js — Tab tinh trang chu SangtacvietApp (khong fetch mang, khong can load config theo Rule 3.1)

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "sort=update", script: "gen.js" },
        { title: "Lượt Đọc Tổng", input: "sort=view", script: "gen.js" },
        { title: "Lượt Đọc Tuần", input: "sort=viewweek", script: "gen.js" },
        { title: "Lượt Đọc Ngày", input: "sort=viewday", script: "gen.js" },
        { title: "Đề Cử", input: "sort=auto", script: "gen.js" },
        { title: "Lượt Thích", input: "sort=like", script: "gen.js" },
        { title: "Theo Dõi", input: "sort=following", script: "gen.js" }
    ]);
}
