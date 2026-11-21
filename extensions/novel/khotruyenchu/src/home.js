// home.js — tab trang chu (tinh, khong tai trang): cac muc danh sach cua site.
// Cac tab deu tro toi book.js; input la duong dan tuyet doi trong site.
function execute() {
    return Response.success([
        { title: "Truyện mới", input: "/truyen-moi/", script: "book.js" },
        { title: "Top Qidian", input: "/top-qidian/", script: "book.js" },
        { title: "Yêu cầu dịch", input: "/yeu-cau-dich/", script: "book.js" },
        { title: "Huyền huyễn - Tiên hiệp", input: "/huyen-huyen-tien-hiep/", script: "book.js" },
        { title: "Đô thị", input: "/do-thi/", script: "book.js" }
    ]);
}
