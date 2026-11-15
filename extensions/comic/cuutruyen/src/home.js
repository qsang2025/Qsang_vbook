// home.js — Cứu Truyện: các tab trang chủ (tĩnh, không fetch).
// Mỗi tab trỏ về gen.js với input là đường dẫn API danh sách.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/api/v2/mangas/recently_updated", script: "gen.js" },
        { title: "Nổi bật", input: "/api/v2/mangas/top?duration=all", script: "gen.js" },
        { title: "Nổi bật tuần", input: "/api/v2/mangas/top?duration=week", script: "gen.js" },
        { title: "Nổi bật tháng", input: "/api/v2/mangas/top?duration=month", script: "gen.js" }
    ]);
}
