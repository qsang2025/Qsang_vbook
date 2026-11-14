// home.js — Tab trang chu (tinh, khong fetch — quy tac 9 AGENTS.md).
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "newupdate", script: "homecontent.js" },
        { title: "Truyện đã hoàn thành", input: "completed", script: "homecontent.js" },
        { title: "Đọc nhiều", input: "popular", script: "homecontent.js" }
    ]);
}
