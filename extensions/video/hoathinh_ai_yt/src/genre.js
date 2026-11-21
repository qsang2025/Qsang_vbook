// genre.js — cac the loai Hoat Hinh AI Donghua tren YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute() {
    return Response.success([
        { title: "Tu Tiên - Phàm Nhân", input: "playlist:hoạt hình AI tu tiên phàm nhân thuyết minh", script: "search.js" },
        { title: "Hệ Thống - Thức Tỉnh", input: "playlist:hoạt hình AI hệ thống thức tỉnh thuyết minh", script: "search.js" },
        { title: "Xuyên Không - Trọng Sinh", input: "playlist:hoạt hình AI xuyên không trọng sinh thuyết minh", script: "search.js" },
        { title: "Mạt Thế - Sinh Tồn", input: "playlist:hoạt hình AI mạt thế sinh tồn thuyết minh", script: "search.js" },
        { title: "Cổ Trang - Kiếm Hiệp", input: "playlist:hoạt hình AI cổ trang kiếm hiệp thuyết minh", script: "search.js" },
        { title: "Huyền Huyễn", input: "playlist:hoạt hình AI huyền huyễn thuyết minh", script: "search.js" },
        { title: "Đô Thị", input: "playlist:hoạt hình AI đô thị thuyết minh", script: "search.js" },
        { title: "Siêu Nét 2K / 4K (60fps)", input: "video:hoạt hình AI 4K 60fps thuyết minh", script: "search.js" },
        { title: "Trọn Bộ Hoàn Thành (Full End)", input: "video:hoạt hình AI trọn bộ full kết thúc thuyết minh", script: "search.js" },
        { title: "Bản Full Trọn Bộ", input: "video:hoạt hình AI Trung Quốc trọn bộ full", script: "search.js" },
        { title: "Marathon Trên 3 Tiếng", input: "min:10800:video:hoạt hình AI Trung Quốc full trọn bộ thuyết minh", script: "search.js" },
        { title: "Top Xem Nhiều Nhất", input: "sort:view_count:video:hoạt hình AI Trung Quốc full thuyết minh", script: "search.js" },
        { title: "Mới Ra Trong Tuần", input: "sort:upload_date:video:hoạt hình AI tu tiên thuyết minh", script: "search.js" },
        { title: "Kênh Tuyển Chọn", input: "channels:featured", script: "search.js" }
    ]);
}
