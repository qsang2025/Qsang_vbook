// home.js — cac tab trang chu cua 繁體小說 (novels.com.tw).
// Tab TINH, khong fetch (bai hoc 2026-11-06): ban dau 4 tab tro ve book.js
// voi input /home/... de parse cac muc tren trang chu / — nhung mo app la
// chay ngay tab dau tien, fetch trang chu / bi Cloudflare chan (403) nen
// trang chu bao loi "Không tải được trang chủ". Cung luc do, extension
// cua mizhm (Novels TW) dung tab tinh tro ve danh sach /nosort/ thi chay
// binh thuong tren may that, nen doi sang cach do: cac tab tro ve book.js
// voi input /nosort/... (listGenre da xu ly san). Cac muc trang chu cu
// (/home/dashen|remen|zuixin|zuixinzhangjie) van duoc book.js ho tro nhu
// input cu, nhung home.js khong dung nua.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/nosort/1/", script: "book.js" },
        { title: "Hoàn thành", input: "/quanben/nosort/1/", script: "book.js" },
        { title: "Người lớn", input: "/nosort/11/1/", script: "book.js" },
        { title: "Nhục văn", input: "/nosort/12/1/", script: "book.js" }
    ]);
}
