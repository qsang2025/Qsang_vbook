// home.js — Cac tab trang chu Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Base co them tab "Truyện trả phí" — BO (muc tra phi, khong phai noi
// dung free). 6 tab con lai deu tro ve gen.js.
load("config.js");

function execute() {
    return Response.success([
        { title: "Truyện đọc nhiều", input: "/danh-muc/bang-xep-hang", script: "gen.js" },
        { title: "Truyện đã hoàn thành", input: "/danh-muc/truyen-da-hoan-thanh", script: "gen.js" },
        { title: "Truyện dịch", input: "/danh-muc/truyen-dich", script: "gen.js" },
        { title: "Truyện convert", input: "/danh-muc/truyen-convert", script: "gen.js" },
        { title: "Truyện sáng tác", input: "/danh-muc/truyen-sang-tac", script: "gen.js" },
        { title: "Truyện đề cử", input: "/danh-muc/truyen-de-cu", script: "gen.js" }
    ]);
}
