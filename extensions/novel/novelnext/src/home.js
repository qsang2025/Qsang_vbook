// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
// Tab theo nav cua site (kiem chung live 2026-11-15):
// "Latest Release" -> /dayvisit/, "Hot Novel" -> /allvisit/,
// "Completed Novel" -> /full.html, "Most Popular" -> /monthvisit/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/dayvisit/", script: "gen.js" },
        { title: "Hot", input: "/allvisit/", script: "gen.js" },
        { title: "Hoàn thành", input: "/full.html", script: "gen.js" },
        { title: "Nổi bật", input: "/monthvisit/", script: "gen.js" }
    ]);
}
