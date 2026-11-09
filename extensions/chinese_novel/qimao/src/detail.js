// detail.js — Chi tiết truyện qua API chính thức của app 七猫免费小说
load('config.js');
load('crypto.js');

function execute(url) {
    if (!url) {
        return Response.error("Đường dẫn truyện không hợp lệ");
    }

    // Trích xuất book_id từ URL (ví dụ https://www.qimao.com/shuku/1803136/ hoặc chuỗi ID)
    var match = url.match(/\/shuku\/(\d+)/);
    var bookId = match ? match[1] : (url.match(/\d+/) ? url.match(/\d+/)[0] : "");

    if (!bookId) {
        return Response.error("Không tìm thấy mã truyện (book_id)");
    }

    var queryParam = "id=" + bookId;
    var sign = signQuery(queryParam);
    var apiUrl = API_BC_URL + "/api/v5/book/detail?id=" + bookId + "&sign=" + sign;

    var response = fetch(apiUrl, {
        method: "GET",
        headers: buildHeaders()
    });

    if (!response.ok) {
        return Response.error("Không thể tải thông tin truyện từ 七猫 (HTTP " + response.status + ")");
    }

    var json = response.json();
    if (!json || !json.data || !json.data.book) {
        return Response.error("Dữ liệu chi tiết truyện rỗng hoặc không tồn tại");
    }

    var b = json.data.book;

    var name = cleanText(b.title || "");
    var author = cleanText(b.author || b.original_author || "");
    var cover = b.image_link || b.thumb_image_link || "";
    if (cover.indexOf("//") === 0) {
        cover = "https:" + cover;
    }

    var description = cleanText(b.intro || "");
    // Trạng thái ra chương: is_over == "0" hoặc 0 là còn tiếp (ongoing: true)
    var isOver = (b.is_over === 1 || b.is_over === "1");
    var ongoing = !isOver;

    // Chi tiết bổ sung: thể loại, số từ, chương mới nhất
    var detailInfo = "";
    if (b.category_over_words) {
        detailInfo = b.category_over_words;
    } else {
        var catParts = [];
        if (b.category1_name) catParts.push(b.category1_name);
        if (b.category2_name) catParts.push(b.category2_name);
        if (ongoing) catParts.push("连载"); else catParts.push("完结");
        detailInfo = catParts.join("・");
    }

    if (b.latest_chapter_title) {
        detailInfo = detailInfo + "<br>Mới nhất: " + cleanText(b.latest_chapter_title);
    }

    var bookUrl = BASE_URL + "/shuku/" + bookId + "/";

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailInfo,
        ongoing: ongoing,
        url: bookUrl,
        host: BASE_URL
    });
}
