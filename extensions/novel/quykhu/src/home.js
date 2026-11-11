function execute() {
    return Response.success([
        { title: "Nổi bật", input: "https://quykhu.com/", script: "gen.js" },
        { title: "Hoàn thành", input: "https://quykhu.com/hoan-thanh", script: "gen.js" },
        { title: "Yêu thích", input: "https://quykhu.com/yeu-thich", script: "gen.js" },
        { title: "Xem nhiều", input: "https://quykhu.com/xem-nhieu", script: "gen.js" },
        { title: "Mới nhất", input: "https://quykhu.com/moi-nhat", script: "gen.js" }
    ]);
}
