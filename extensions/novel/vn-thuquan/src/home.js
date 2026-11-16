// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 4 tab danh sach (kiem chung live 2026-11-16, deu tra 200):
// /Truyen/moinhat/ (1.601 trang), /Truyen/luotxem/ (doc nhieu nhat),
// /Truyen/danhgia/ (danh gia cao), /Truyen/TacGiaTheoKhuVuc/VietNam/
// (tac gia Viet Nam). Tat ca dung chung bo cuc card cua gen.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới nhất", input: "https://vnthuquan.org/Truyen/moinhat/Trang-1", script: "gen.js" },
        { title: "Đọc nhiều nhất", input: "https://vnthuquan.org/Truyen/luotxem/Trang-1", script: "gen.js" },
        { title: "Đánh giá cao", input: "https://vnthuquan.org/Truyen/danhgia/Trang-1", script: "gen.js" },
        { title: "Tác giả Việt Nam", input: "https://vnthuquan.org/Truyen/TacGiaTheoKhuVuc/VietNam/Trang-1", script: "gen.js" }
    ]);
}
