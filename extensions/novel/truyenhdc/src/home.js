// home.js — Cac tab trang chu TruyenHD (truyenhdc.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Hai muc co bang SSR that: /truyen-dich (maxpage 231) va
// /truyen-sang-tac (maxpage 340) — deu chay qua gen.js.
load("config.js");

function execute() {
    return Response.success([
        { title: "Truyện dịch", input: "/truyen-dich", script: "gen.js" },
        { title: "Truyện sáng tác", input: "/truyen-sang-tac", script: "gen.js" }
    ]);
}
