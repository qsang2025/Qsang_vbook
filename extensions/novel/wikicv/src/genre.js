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
        { title: "Hoàn thành", input: BASE_URL + "/tim-kiem?qs=2&status=5794f03dd7ced228f4419191", script: "book.js" }
    ]);
}