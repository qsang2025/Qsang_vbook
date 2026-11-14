// home.js — Cac tab trang chu Truyen Hay (truyenhay.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Tab tro ve gen.js: "" la tat ca bai moi nhat, so la id chuyen muc
// (kiem chung live 2026-11-14: 3 Cuoc song, 8 Hon nhan, 10 Me don than).
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "", script: "gen.js" },
        { title: "Cuộc sống", input: "3", script: "gen.js" },
        { title: "Hôn nhân", input: "8", script: "gen.js" },
        { title: "Mẹ đơn thân", input: "10", script: "gen.js" }
    ]);
}
