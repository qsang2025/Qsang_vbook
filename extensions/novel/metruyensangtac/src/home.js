// home.js — Tab tinh cua Me Truyen Sang Tac (metruyensangtac.vn).
// Chi tra ve tab tinh, KHONG fetch (AGENTS.md muc 6.9).
load("config.js");

function execute() {
    return Response.success([
        { title: "BTV Đề Cử", input: "home", script: "homecontent.js" },
        { title: "Chương Mới Cập Nhật", input: "updated", script: "homecontent.js" },
        { title: "Truyện Mới", input: "new", script: "homecontent.js" },
        { title: "Truyện Hoàn Thành", input: "full", script: "homecontent.js" }
    ]);
}
