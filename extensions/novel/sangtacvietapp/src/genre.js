// genre.js — The loai SangtacvietApp (tra mang tinh khong can load config theo Rule 3.1)

function execute() {
    return Response.success([
        { title: "Huyền Huyễn", input: "category=hh", script: "gen.js" },
        { title: "Đô Thị", input: "category=dt", script: "gen.js" },
        { title: "Ngôn Tình", input: "category=nt", script: "gen.js" },
        { title: "Võng Du", input: "category=vd", script: "gen.js" },
        { title: "Khoa Huyễn", input: "category=kh", script: "gen.js" },
        { title: "Lịch Sử", input: "category=ls", script: "gen.js" },
        { title: "Đồng Nhân", input: "category=dn", script: "gen.js" },
        { title: "Dị Năng", input: "category=dna", script: "gen.js" },
        { title: "Linh Dị", input: "category=ld", script: "gen.js" },
        { title: "Light Novel", input: "category=ln", script: "gen.js" }
    ]);
}
