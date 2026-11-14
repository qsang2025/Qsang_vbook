// home.js — cac tab trang chu (wfxs.tw).
// Chi tra tab tinh, khong fetch. Moi tab tro ve search.js voi input la
// duong dan danh sach cua site (xem search.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/toppostdate/1.html", script: "search.js" },
        { title: "Xếp hạng", input: "/topallvisit/1.html", script: "search.js" },
        { title: "Mới nhập kho", input: "/toplastupdate/1.html", script: "search.js" }
    ]);
}
