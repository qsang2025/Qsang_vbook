// home.js — Cac tab trang chu AkayTruyen (akaytruyen.com).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Cac muc tren trang chu (Truyen Hot / Truyen Moi / Truyen hoan thanh)
// khong co URL danh sach rieng (kiem chung live 2026-11-13: /truyen-moi,
// /truyen-hot, /truyen-full deu 404) nen tab dau tro ve gen.js voi "/"
// (toan bo the truyen tren trang chu, dedupe), cac tab con lai la the
// loai pho bien (genre.js co du 23 the loai).
function execute() {
    return Response.success([
        { title: "Trang chủ", input: "/", script: "gen.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep", script: "gen.js" },
        { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen", script: "gen.js" },
        { title: "Cổ Đại", input: "/the-loai/co-dai", script: "gen.js" },
        { title: "Hiện Đại", input: "/the-loai/hien-dai", script: "gen.js" }
    ]);
}
