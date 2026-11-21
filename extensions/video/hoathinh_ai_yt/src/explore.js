// explore.js — man hinh Kham Pha dang bang chuyen cho Hoat Hinh AI YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');

function execute() {
    var chList = getAllFeaturedChannels();
    var chItems = [];
    var i = 0;
    for (i = 0; i < chList.length; i++) {
        var ch = chList[i];
        var link = ch.id ? (BASE_URL + "/channel/" + ch.id) : (BASE_URL + "/" + ch.handle);
        chItems.push({
            name: ch.title,
            cover: ch.cover || "",
            link: link,
            description: ch.description || "Kênh Hoạt Hình AI",
            host: BASE_URL
        });
    }

    var sections = [];
    if (chItems.length > 0) {
        sections.push({
            id: "channels",
            title: "Kênh Hoạt Hình AI Tuyển Chọn",
            subtitle: "Các kênh đăng bộ dài & marathon hàng ngày",
            type: "horizontal_list",
            shape: "circle",
            items: chItems,
            more: {
                type: "list",
                name: "Kênh Tuyển Chọn",
                script: "search.js",
                input: "channels:featured"
            }
        });
    }

    sections.push({
        id: "new_week",
        title: "Mới Ra Trong Tuần",
        subtitle: "Hoạt hình AI tu tiên mới đăng",
        type: "horizontal_list",
        shape: "movie",
        script: "search.js",
        input: "sort:upload_date:video:hoạt hình AI tu tiên thuyết minh",
        more: {
            type: "list",
            name: "Mới Ra Trong Tuần",
            script: "search.js",
            input: "sort:upload_date:video:hoạt hình AI tu tiên thuyết minh"
        }
    });

    sections.push({
        id: "marathon",
        title: "Marathon Trên 3 Tiếng",
        subtitle: "Xem liền mạch trọn bộ nhiều giờ",
        type: "horizontal_list",
        shape: "movie",
        script: "search.js",
        input: "min:10800:video:hoạt hình AI Trung Quốc full trọn bộ thuyết minh",
        more: {
            type: "list",
            name: "Marathon Trên 3 Tiếng",
            script: "search.js",
            input: "min:10800:video:hoạt hình AI Trung Quốc full trọn bộ thuyết minh"
        }
    });

    sections.push({
        id: "playlists",
        title: "Bộ AI Dài Tập (Playlist)",
        subtitle: "Danh sách phát nhiều tập liên tục",
        type: "horizontal_list",
        shape: "movie",
        script: "search.js",
        input: "playlist:hoạt hình AI Trung Quốc trọn bộ",
        more: {
            type: "list",
            name: "Bộ AI Dài Tập (Playlist)",
            script: "search.js",
            input: "playlist:hoạt hình AI Trung Quốc trọn bộ"
        }
    });

    sections.push({
        id: "top_views",
        title: "Top Xem Nhiều Nhất",
        subtitle: "Cuộn xuống để tải thêm tự động",
        type: "grid",
        shape: "movie",
        script: "search.js",
        input: "sort:view_count:video:hoạt hình AI Trung Quốc full thuyết minh",
        more: {
            type: "list",
            name: "Top Xem Nhiều Nhất",
            script: "search.js",
            input: "sort:view_count:video:hoạt hình AI Trung Quốc full thuyết minh"
        }
    });

    return Response.success(sections);
}
