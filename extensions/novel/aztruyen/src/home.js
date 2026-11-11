// home.js — Cac tab trang chu AzTruyen (aztruyen.top).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Trang chu co 2 muc trong 2 div.row.storylist (kiem chung live
// 2026-11-11): 0 = "Top Truyện Hay", 1 = "Truyện mới cập nhật", moi muc
// 12 truyen, khong phan trang. Input truyen sang book.js kem hau to muc
// `/#top` / `/#moi` (book.js tach hau to truoc khi fetch).
function execute() {
    return Response.success([
        { title: "Top Truyện Hay", input: "/#top", script: "book.js" },
        { title: "Mới cập nhật", input: "/#moi", script: "book.js" }
    ]);
}
