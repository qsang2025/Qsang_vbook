// genre.js — danh sach the loai (tinh). Site khong co trang chi muc the loai;
// chi co 2 archive the loai ton tai that da kiem chung live 21/11:
// /huyen-huyen-tien-hiep/ (3 trang) va /do-thi/ (1 trang). Cac slug doan
// khac (tien-hiep, kiem-hiep, di-gioi, khoa-huyen, lich-su...) deu 404.
function execute() {
    return Response.success([
        { title: "Huyền huyễn - Tiên hiệp", input: "/huyen-huyen-tien-hiep/", script: "book.js" },
        { title: "Đô thị", input: "/do-thi/", script: "book.js" }
    ]);
}
