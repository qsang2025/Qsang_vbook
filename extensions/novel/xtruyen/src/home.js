// home.js — cac tab trang chu cua XTruyen (chi tra tab tinh, khong fetch).
// Moi tab co input la duong dan chuyen muc; app se goi book.js voi input do.
// Khong can nap config.js vi khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/truyen/?m_orderby=latest", script: "book.js" },
        { title: "Xem nhiều", input: "/truyen/?m_orderby=views", script: "book.js" },
        { title: "Truyện Full", input: "/truyen/?m_orderby=trending&status=end", script: "book.js" },
        { title: "Đang hot", input: "/truyen/?m_orderby=trending", script: "book.js" }
    ]);
}
