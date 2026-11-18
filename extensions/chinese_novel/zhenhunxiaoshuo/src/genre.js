// genre.js — danh sach the loai (chi tra muc tinh, khong fetch).
//
// Site chi co 3 the loai truyen that (nav #sitenav): 纯爱小说, 言情小说,
// 百合小说. Muc 作者 la chi muc tac gia (khac layout) nen khong dua vao.
// Moi muc tro ve book.js (giong tab home).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "纯爱小说", input: BASE_URL + "/chunai/", script: "book.js" },
        { title: "言情小说", input: BASE_URL + "/yanqing/", script: "book.js" },
        { title: "百合小说", input: BASE_URL + "/baihexiaoshuo/", script: "book.js" }
    ]);
}
