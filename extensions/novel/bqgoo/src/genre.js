// genre.js — danh sach the loai cua Bqgoo (bqgoo.cc).
// DU 8 the loai cua /api/sort (khao sat 2026-11-11, moi key tra 150
// truyen): xuanhuan 玄幻, wuxia 武侠, dushi 都市, lishi 历史,
// wangyou 网游, kehuan 科幻, nvsheng 女生, finish 完本.
// Moi muc tro ve book.js voi input la "sort:<key>".
// Luu y: noi dung nvsheng / kehuan co lan truyen khong khop the loai
// (vd. kehuan tra truyen khong phai khoa hoc vien tuong) — loi du lieu
// cua site, khong phai loi extension.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻", input: "sort:xuanhuan", script: "book.js" },
        { title: "武侠", input: "sort:wuxia", script: "book.js" },
        { title: "都市", input: "sort:dushi", script: "book.js" },
        { title: "历史", input: "sort:lishi", script: "book.js" },
        { title: "网游", input: "sort:wangyou", script: "book.js" },
        { title: "科幻", input: "sort:kehuan", script: "book.js" },
        { title: "女生", input: "sort:nvsheng", script: "book.js" },
        { title: "完本", input: "sort:finish", script: "book.js" }
    ]);
}
