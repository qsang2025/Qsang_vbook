// home.js — cac tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md muc 6.9).
//
// Cac chuyen muc that cua site (nav #sitenav):
// - /chunai/ .. /chunai5/  : 纯爱小说 (5 trang, moi trang 1 bang truyen)
// - /yanqing/ , /yanqing2/ : 言情小说 (2 trang)
// - /baihexiaoshuo/        : 百合小说 (1 trang)
// Muc 作者 la chi muc tac gia (khac layout) va 查询 khong phai tim kiem
// that nen khong dua vao tab. Moi tab tro ve book.js voi input la URL
// chuyen muc day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "纯爱小说", input: BASE_URL + "/chunai/", script: "book.js" },
        { title: "纯爱小说 2", input: BASE_URL + "/chunai2/", script: "book.js" },
        { title: "纯爱小说 3", input: BASE_URL + "/chunai3/", script: "book.js" },
        { title: "言情小说", input: BASE_URL + "/yanqing/", script: "book.js" },
        { title: "言情小说 2", input: BASE_URL + "/yanqing2/", script: "book.js" },
        { title: "百合小说", input: BASE_URL + "/baihexiaoshuo/", script: "book.js" }
    ]);
}
