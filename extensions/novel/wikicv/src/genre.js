// genre.js — Danh sách thể loại (từ tag-tabs thật trên trang chủ)
// Contract: execute() → [{ title, input, script }]
load("config.js");
function execute() {
    return Response.success([
        { title: "Xuyên việt", input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191af", script: "book.js" },
        { title: "Trọng sinh", input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191b4", script: "book.js" },
        { title: "Cổ đại",     input: BASE_URL + "/tim-kiem?qs=2&age=5794f03dd7ced228f441919b", script: "book.js" },
        { title: "Hiện đại",   input: BASE_URL + "/tim-kiem?qs=2&age=5794f03dd7ced228f441919d", script: "book.js" },
        { title: "Tương lai",  input: BASE_URL + "/tim-kiem?qs=2&age=5794f03dd7ced228f441919e&tag=5794f03dd7ced228f44191c6", script: "book.js" },
        { title: "Mạt thế",    input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191ac", script: "book.js" },
        { title: "Huyền huyễn", input: BASE_URL + "/tim-kiem?qs=2&genre=57d17c94d7ced218fcd2734b", script: "book.js" },
        { title: "Ma pháp",    input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191b0", script: "book.js" },
        { title: "Võ hiệp",    input: BASE_URL + "/tim-kiem?qs=2&genre=5794f03dd7ced228f44191a3", script: "book.js" },
        { title: "Tiên hiệp",  input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191ad&genre=5794f03dd7ced228f44191a4", script: "book.js" },
        { title: "Võng du",    input: BASE_URL + "/tim-kiem?qs=2&genre=5794f03dd7ced228f44191a5", script: "book.js" },
        { title: "Làm ruộng",  input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191c0", script: "book.js" },
        { title: "Mỹ thực",    input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191c5", script: "book.js" },
        { title: "Kinh dị",    input: BASE_URL + "/tim-kiem?qs=2&genre=5794f03dd7ced228f44191a6", script: "book.js" },
        { title: "Hệ thống",   input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191b6", script: "book.js" },
        { title: "Cung đấu",   input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191d7", script: "book.js" },
        { title: "Trinh thám", input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191c1&genre=5794f03dd7ced228f44191a7", script: "book.js" },
        { title: "Hoàn thành", input: BASE_URL + "/tim-kiem?qs=2&status=5794f03dd7ced228f4419191", script: "book.js" },
        // 7 muc bo sung 2026-11-11 (lay tu trang chu, ID day du da kiem chung):
        // 5 tag + 2 trang thai. Tat ca qua /tim-kiem?qs=2 nen chi chay
        // sau khi dang nhap (xem README).
        { title: "Tùy thân không gian", input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191bb", script: "book.js" },
        { title: "Sinh con",    input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191c2", script: "book.js" },
        { title: "Chủ công",    input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03dd7ced228f44191cc", script: "book.js" },
        { title: "Trạch đấu",   input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03ed7ced228f44191dc", script: "book.js" },
        { title: "Giới giải trí", input: BASE_URL + "/tim-kiem?qs=2&tag=5794f03ed7ced228f44191de", script: "book.js" },
        { title: "Còn tiếp",    input: BASE_URL + "/tim-kiem?qs=2&status=5794f03dd7ced228f4419192", script: "book.js" },
        { title: "Chưa xác minh", input: BASE_URL + "/tim-kiem?qs=2&status=59c6a50112fb553750272b0a", script: "book.js" },
        // 7 chuyen muc Review (/review?cat=..) — khong can dang nhap,
        // phan trang 10/trang (book.js tu xu ly co trang theo URL).
        { title: "Review: Ngôn tình", input: BASE_URL + "/review?cat=5794f03dd7ced228f4419195", script: "book.js" },
        { title: "Review: Nam sinh",  input: BASE_URL + "/review?cat=5794f03dd7ced228f4419196", script: "book.js" },
        { title: "Review: Đam mỹ",    input: BASE_URL + "/review?cat=5794f03dd7ced228f4419197", script: "book.js" },
        { title: "Review: Bách hợp",  input: BASE_URL + "/review?cat=5794f03dd7ced228f4419198", script: "book.js" },
        { title: "Review: Nữ tôn",    input: BASE_URL + "/review?cat=5794f03dd7ced228f4419199", script: "book.js" },
        { title: "Review: Không CP",  input: BASE_URL + "/review?cat=5794f03dd7ced228f441919a", script: "book.js" },
        { title: "Review: Đa nguyên", input: BASE_URL + "/review?cat=6867732623deea6af9481d15", script: "book.js" }
    ]);
}