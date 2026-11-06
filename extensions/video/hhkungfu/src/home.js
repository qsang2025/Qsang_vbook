// home.js — cac tab tren trang chu HHKUNGFU.
// Moi tab goi search.js voi `input` la duong dan cua trang do tren site:
// /moi-cap-nhat, /top-xem-nhieu, /hoan-thanh (moi trang 16 phim,
// phan trang /page/N/). Trang chu goc (/) hien cung noi dung
// "Mới cập nhật" nhung khong phan trang nen tab dung /moi-cap-nhat.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/moi-cap-nhat", script: "search.js" },
        { title: "Xem Nhiều", input: "/top-xem-nhieu", script: "search.js" },
        { title: "Hoàn Thành", input: "/hoan-thanh", script: "search.js" }
    ]);
}
