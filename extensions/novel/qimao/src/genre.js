// genre.js — danh sach the loai/loc cua 七猫免费小说 (qimao.com).
// GIOI HAN BIET TRUOC (khao sat 2026-11-09): URL loc /shuku/ co 7 doan
// ngan cach bang "-" (vd a-1-278-4-3-a-1) nhung y nghia tung doan CHUA
// giai ma day du tu giao dien loc (chi suy doan: doan 7 = trang thai
// 0 连载中 / 1 已完结 / a tat ca; doan 3 co ve la the loai nho).
// Vi vay genre.js CHI liet ke cac bo loc DA KIEM CHUNG URL that qua
// ket qua tim kiem live, khong tu suy doan URL the loai moi — tranh
// dan nguoi dung vao trang loc sai. Moi muc tro ve book.js.
// Neu sau nay giai ma duoc cay loc day du (can mo trang /shuku/ tren
// trinh duyet that va doc cac link loc), mo rong danh sach nay.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "全部 · 连载中", input: "/shuku/a-a-a-a-a-a-0-update_time-1/", script: "book.js" },
        { title: "全部 · 已完结", input: "/shuku/a-a-a-a-a-a-1-click-1/", script: "book.js" },
        { title: "7天内更新 · 连载中", input: "/shuku/1-a-a-a-2-a-0-update_time-1/", script: "book.js" },
        { title: "玄幻仙侠 · 7天内更新 · 30万以下", input: "/shuku/a-4-21-1-2-a-a-click-1/", script: "book.js" },
        { title: "年代重生 · 30天内更新 · 100-200万字 · 已完结", input: "/shuku/a-1-278-4-3-a-1-update_time-1/", script: "book.js" }
    ]);
}
