// home.js — tab trang chu tinh cua 乐文小说 (lwxs.com).
// 3 tab deu tro ve script danh sach, input "/" (trang chu). Tab tinh,
// khong fetch o day (xem AGENTS.md quy tac 9).
function execute() {
    return Response.success([
        { title: "Mới Cập Nhật", input: "/", script: "up.js" },
        { title: "Mới Lên Kệ", input: "/", script: "up1.js" },
        { title: "Sách Mới Nổi Bật", input: "/", script: "up2.js" }
    ]);
}
