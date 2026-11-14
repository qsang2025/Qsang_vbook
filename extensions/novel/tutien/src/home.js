// home.js — Tab tinh cua TruyenCv (tutien.pro).
// Chi tra ve tab tinh, KHONG fetch (AGENTS.md muc 6.9).
load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "latest", script: "homecontent.js" },
        { title: "Truyện hoàn thành", input: "completed", script: "homecontent.js" },
        { title: "Đề cử", input: "top", script: "homecontent.js" }
    ]);
}
