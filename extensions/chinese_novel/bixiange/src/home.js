// home.js — Tab trang chu Bixiange (tinh, khong fetch).
// Load: file config.js.
load('config.js');

function execute() {
    return Response.success([
        { title: "Mới nhất", input: "newest", script: "gen.js" },
        { title: "Nổi bật", input: "sort", script: "gen.js" },
        { title: "Đề xuất", input: "home", script: "gen.js" }
    ]);
}
