// genre.js — Danh sach the loai Tiem Truyen Chu (khong fetch mang)
function execute() {
    return Response.success([
        { title: "Huyền huyễn", input: "stories?cat=huyen-huyen", script: "gen.js" },
        { title: "Tiên hiệp", input: "stories?cat=tien-hiep", script: "gen.js" },
        { title: "Đô thị", input: "stories?cat=do-thi", script: "gen.js" },
        { title: "Khoa huyễn", input: "stories?cat=khoa-huyen", script: "gen.js" },
        { title: "Kiếm hiệp", input: "stories?cat=kiem-hiep", script: "gen.js" },
        { title: "Dị năng", input: "stories?cat=di-nang", script: "gen.js" },
        { title: "Quân sự", input: "stories?cat=quan-su", script: "gen.js" },
        { title: "Lịch sử", input: "stories?cat=lich-su", script: "gen.js" },
        { title: "Võng du", input: "stories?cat=vong-du", script: "gen.js" },
        { title: "Đồng nhân", input: "stories?cat=dong-nhan", script: "gen.js" },
        { title: "Linh dị", input: "stories?cat=linh-di", script: "gen.js" },
        { title: "Điền văn", input: "stories?cat=dien-van", script: "gen.js" },
        { title: "Hiện đại", input: "stories?cat=hien-dai", script: "gen.js" },
        { title: "Cổ đại", input: "stories?cat=co-dai", script: "gen.js" },
        { title: "Ngôn tình", input: "stories?cat=ngon-tinh", script: "gen.js" },
        { title: "Trọng sinh", input: "stories?cat=trong-sinh", script: "gen.js" },
        { title: "Xuyên không", input: "stories?cat=xuyen-khong", script: "gen.js" },
        { title: "Cạnh kỹ", input: "stories?cat=canh-ky", script: "gen.js" },
        { title: "Khác", input: "stories?cat=khac", script: "gen.js" }
    ]);
}
