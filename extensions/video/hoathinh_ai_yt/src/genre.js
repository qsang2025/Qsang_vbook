// genre.js — cac the loai Hoat Hinh AI Donghua tren YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute() {
    return Response.success([
        { title: "Tu Tiên", input: "playlist:hoạt hình AI tu tiên thuyết minh", script: "search.js" },
        { title: "Huyền Huyễn", input: "playlist:hoạt hình AI huyền huyễn thuyết minh", script: "search.js" },
        { title: "Mạt Thế", input: "playlist:hoạt hình AI mạt thế thuyết minh", script: "search.js" },
        { title: "Hệ Thống", input: "playlist:hoạt hình AI hệ thống thuyết minh", script: "search.js" },
        { title: "Xuyên Không", input: "playlist:hoạt hình AI xuyên không thuyết minh", script: "search.js" },
        { title: "Trùng Sinh", input: "playlist:hoạt hình AI trùng sinh thuyết minh", script: "search.js" },
        { title: "Đô Thị", input: "playlist:hoạt hình AI đô thị thuyết minh", script: "search.js" },
        { title: "Kiếm Hiệp", input: "playlist:hoạt hình AI kiếm hiệp thuyết minh", script: "search.js" },
        { title: "Bản Full Trọn Bộ", input: "video:hoạt hình AI Trung Quốc trọn bộ full", script: "search.js" },
        { title: "Kênh Tuyển Chọn", input: "channels:featured", script: "search.js" }
    ]);
}
