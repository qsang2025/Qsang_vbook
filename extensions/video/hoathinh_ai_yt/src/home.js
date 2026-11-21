// home.js — cac tab trang chu tinh cua Hoat Hinh AI YouTube.
// Tab tinh, khong fetch (AGENTS.md §6 quy tac 9).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute() {
    return Response.success([
        {
            title: "Bộ AI Dài Tập",
            input: "playlist:hoạt hình AI Trung Quốc trọn bộ",
            script: "search.js"
        },
        {
            title: "AI Tu Tiên Dài Tập",
            input: "playlist:hoạt hình AI tu tiên thuyết minh",
            script: "search.js"
        },
        {
            title: "AI Mạt Thế / Hệ Thống",
            input: "playlist:hoạt hình AI mạt thế hệ thống",
            script: "search.js"
        },
        {
            title: "Bản Full Nhiều Tiếng",
            input: "video:hoạt hình AI Trung Quốc full thuyết minh",
            script: "search.js"
        },
        {
            title: "Marathon Trên 3 Tiếng",
            input: "min:10800:video:hoạt hình AI Trung Quốc full trọn bộ thuyết minh",
            script: "search.js"
        },
        {
            title: "Top Xem Nhiều Nhất",
            input: "sort:view_count:video:hoạt hình AI Trung Quốc full thuyết minh",
            script: "search.js"
        },
        {
            title: "Mới Ra Trong Tuần",
            input: "sort:upload_date:video:hoạt hình AI tu tiên thuyết minh",
            script: "search.js"
        },
        {
            title: "Kênh Tuyển Chọn",
            input: "channels:featured",
            script: "search.js"
        }
    ]);
}
