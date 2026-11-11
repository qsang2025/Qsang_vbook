// home.js — Cac tab trang chu (Zongheng).
// Tab tinh, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la URL danh sach. 6 tab bang xep hang lay du lieu tu payload
// __NUXT__ cua trang /rank (kiem chung 2026-11-11: moi trang /rank nao
// cung chua du 6 danh sach top 10); tab "Moi cap nhat" dung trang store
// (danh sach 50 truyen moi cap nhat, khong loc theo the loai).
// v2 (2026-11-11): them 3 tab bang xep hang tu API cong khai cua app
// (POST /api/rank/list, rankType 3/7/8 — kiem chung an danh code 200):
// 畅销榜 ~ rt=3 24h畅销榜, 推荐票榜 (phieu de cu), 打赏榜 ~ rt=7 捧场榜.
// rt=8 完结榜 va rt=10 24h更新榜 KHONG co tuong duong trong app API
// (rankType 10 tra HTTP 500) nen khong them — xem book.js + PROGRESS.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "月票榜", input: "https://www.zongheng.com/rank?nav=monthly-ticket&rankType=1", script: "book.js" },
        { title: "人气榜", input: "https://www.zongheng.com/rank?nav=default", script: "book.js" },
        { title: "新书榜", input: "https://www.zongheng.com/rank?nav=new-book&rankType=4", script: "book.js" },
        { title: "点击榜", input: "https://www.zongheng.com/rank?nav=click&rankType=5", script: "book.js" },
        { title: "推荐榜", input: "https://www.zongheng.com/rank?nav=recommend&rankType=6", script: "book.js" },
        { title: "新书订阅榜", input: "https://www.zongheng.com/rank?nav=new-book-subscribe&rankType=9", script: "book.js" },
        { title: "畅销榜", input: "https://api2.zongheng.com/api/rank/list?rankType=3", script: "book.js" },
        { title: "推荐票榜", input: "https://api2.zongheng.com/api/rank/list?rankType=7", script: "book.js" },
        { title: "打赏榜", input: "https://api2.zongheng.com/api/rank/list?rankType=8", script: "book.js" },
        { title: "Mới cập nhật", input: "https://book.zongheng.com/store/c0/c0/b0/u0/p1/v9/s9/t0/u0/i1/ALL.html", script: "book.js" }
    ]);
}
