// home.js — Cac tab trang chu Me Doc Truyen Chu (medoctruyenchu.net).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Cac muc tren trang chu (Truyện Hot / Truyện Mới / Truyện đã hoàn
// thành) khong co URL danh sach rieng (kiem chung live 2026-11-14) nen
// tab dau tro ve gen.js voi "/" (toan bo truyen tren trang chu, dedupe),
// cac tab con lai la the loai pho bien (genre.js co du 19 the loai).
// Tien le nhu akaytruyen (#25).
load("config.js");

function execute() {
    return Response.success([
        { title: "Trang chủ", input: "/", script: "gen.js" },
        { title: "Tiên Hiệp", input: "/the-loai/tien-hiep", script: "gen.js" },
        { title: "Ngôn Tình", input: "/the-loai/ngon-tinh", script: "gen.js" },
        { title: "Cổ Đại", input: "/the-loai/co-dai", script: "gen.js" },
        { title: "Xuyên Không", input: "/the-loai/xuyen-khong", script: "gen.js" }
    ]);
}
