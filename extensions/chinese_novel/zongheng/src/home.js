// home.js — Cac tab trang chu (Zongheng).
// Tab tinh, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la URL danh sach. 6 tab bang xep hang lay du lieu tu payload
// __NUXT__ cua trang /rank (kiem chung 2026-11-11: moi trang /rank nao
// cung chua du 6 danh sach top 10); tab "Moi cap nhat" dung trang store
// (danh sach 50 truyen moi cap nhat, khong loc theo the loai).
// 4 bang con lai cua site (24h ban chay, bang ung ho, bang hoan thanh,
// 24h cap nhat) chi nap bang API client-side, khong co trong SSR
// nen v1 chua co — xem ZONGHENG-PROGRESS.md.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "月票榜", input: "https://www.zongheng.com/rank?nav=monthly-ticket&rankType=1", script: "book.js" },
        { title: "人气榜", input: "https://www.zongheng.com/rank?nav=default", script: "book.js" },
        { title: "新书榜", input: "https://www.zongheng.com/rank?nav=new-book&rankType=4", script: "book.js" },
        { title: "点击榜", input: "https://www.zongheng.com/rank?nav=click&rankType=5", script: "book.js" },
        { title: "推荐榜", input: "https://www.zongheng.com/rank?nav=recommend&rankType=6", script: "book.js" },
        { title: "新书订阅榜", input: "https://www.zongheng.com/rank?nav=new-book-subscribe&rankType=9", script: "book.js" },
        { title: "Mới cập nhật", input: "https://book.zongheng.com/store/c0/c0/b0/u0/p1/v9/s9/t0/u0/i1/ALL.html", script: "book.js" }
    ]);
}
