// home.js — Cac tab tinh trang chu Tiem Truyen Chu (khong fetch mang)
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "stories?sort=updated", script: "gen.js" },
        { title: "Truyện mới", input: "stories?sort=new", script: "gen.js" },
        { title: "Truyện Full", input: "stories?status=full", script: "gen.js" },
        { title: "Xem nhiều", input: "stories?sort=views", script: "gen.js" },
        { title: "Truyện Nam", input: "stories?gender=nam", script: "gen.js" },
        { title: "Truyện Nữ", input: "stories?gender=nu", script: "gen.js" },
        { title: "BXH Lượt xem", input: "ranking?by=views", script: "gen.js" },
        { title: "BXH Đề cử", input: "ranking?by=nominations", script: "gen.js" },
        { title: "BXH Theo dõi", input: "ranking?by=follows", script: "gen.js" },
        { title: "BXH Quà tặng", input: "ranking?by=gift", script: "gen.js" },
        { title: "BXH Bình luận", input: "ranking?by=comments", script: "gen.js" }
    ]);
}
