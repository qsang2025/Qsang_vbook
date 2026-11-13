// home.js — cac tab trang chu (chi tra tab tinh, khong fetch — AGENTS.md muc 6.9).
//
// Cac muc danh sach that tren docln.sbs (da kiem chung live 2026-11-13):
// - /danh-sach?truyendich=1&sapxep=capnhat   Truyen dich moi cap nhat
// - /danh-sach?truyendich=1&sapxep=topthang  Top thang
// - /danh-sach?truyendich=1&sapxep=top       Top toan thoi gian
// - /danh-sach?truyendich=1&sapxep=truyenmoi Truyen dich moi
// - /danh-sach?sangtac=1&sapxep=capnhat      Sang tac moi cap nhat
// Moi tab tro ve gen.js voi input la URL day du cua chuyen muc.
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/danh-sach?truyendich=1&sapxep=capnhat", script: "gen.js" },
        { title: "Top tháng", input: BASE_URL + "/danh-sach?truyendich=1&sapxep=topthang", script: "gen.js" },
        { title: "Top toàn thời gian", input: BASE_URL + "/danh-sach?truyendich=1&sapxep=top", script: "gen.js" },
        { title: "Truyện mới", input: BASE_URL + "/danh-sach?truyendich=1&sapxep=truyenmoi", script: "gen.js" },
        { title: "Sáng tác mới cập nhật", input: BASE_URL + "/danh-sach?sangtac=1&sapxep=capnhat", script: "gen.js" }
    ]);
}
