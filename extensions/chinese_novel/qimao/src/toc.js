// toc.js — Mục lục chương qua API chính thức của app 七猫免费小说
load('config.js');
load('crypto.js');

function execute(url) {
    if (!url) {
        return Response.error("Đường dẫn truyện không hợp lệ");
    }

    // Trích xuất book_id từ URL
    var match = url.match(/\/shuku\/(\d+)/);
    var bookId = match ? match[1] : (url.match(/\d+/) ? url.match(/\d+/)[0] : "");

    if (!bookId) {
        return Response.error("Không tìm thấy mã truyện (book_id)");
    }

    var queryParam = "id=" + bookId;
    var sign = signQuery(queryParam);
    var apiUrl = API_KS_URL + "/api/v1/chapter/chapter-list?id=" + bookId + "&sign=" + sign;

    var response = fetch(apiUrl, {
        method: "GET",
        headers: buildHeaders()
    });

    if (!response.ok) {
        return Response.error("Không thể tải mục lục chương từ 七猫 (HTTP " + response.status + ")");
    }

    var json = response.json();
    if (!json || !json.data || !json.data.chapter_lists) {
        return Response.error("Mục lục chương rỗng hoặc không tồn tại");
    }

    var rawList = json.data.chapter_lists;
    var chapters = [];

    for (var i = 0; i < rawList.length; i++) {
        var item = rawList[i];
        var chapterTitle = cleanText(item.title || ("Chương " + (i + 1)));
        var chapterId = item.id;

        // Định dạng URL chương chuẩn: BASE_URL + "/shuku/" + bookId + "/" + chapterId + "/"
        var chapterUrl = BASE_URL + "/shuku/" + bookId + "/" + chapterId + "/";

        chapters.push({
            name: chapterTitle,
            url: chapterUrl,
            host: BASE_URL
        });
    }

    return Response.success(chapters);
}
