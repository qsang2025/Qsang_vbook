// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
// Tab dau tien tro ve /novels/ (danh sach 8 truyen, on dinh) theo
// bai hoc AGENTS.md muc 6.9 — khong parse trang chu / o tab dau.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Truyện", input: "/novels/", script: "gen.js" },
        { title: "Mới cập nhật", input: "/", script: "gen.js" }
    ]);
}
