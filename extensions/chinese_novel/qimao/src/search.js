// search.js — Tìm kiếm truyện qua API chính thức của app 七猫免费小说
load('config.js');
load('crypto.js');

function execute(key, page) {
    if (!key) {
        return Response.error("Vui lòng nhập từ khóa tìm kiếm");
    }
    if (!page) page = "1";

    var pageNum = parseInt(page, 10) || 1;
    // API v7: trang 1 là page=1 (hoặc không truyền), trang tiếp theo là page=2, 3...
    var queryParam = "";
    if (pageNum > 1) {
        // Thứ tự sắp xếp tham số query để tính sign nhất quán
        queryParam = "page=" + pageNum + "wd=" + key;
    } else {
        queryParam = "wd=" + key;
    }

    var sign = signQuery(queryParam);
    var searchUrl = API_BC_URL + "/api/v7/search/words?wd=" + encodeURIComponent(key);
    if (pageNum > 1) {
        searchUrl = searchUrl + "&page=" + pageNum;
    }
    searchUrl = searchUrl + "&sign=" + sign;

    var response = fetch(searchUrl, {
        method: "GET",
        headers: buildHeaders()
    });

    if (!response.ok) {
        return Response.error("Lỗi kết nối tới máy chủ 七猫 (HTTP " + response.status + ")");
    }

    var json = response.json();
    if (!json || !json.data || !json.data.books) {
        return Response.success([]);
    }

    var books = json.data.books;
    var data = [];

    for (var i = 0; i < books.length; i++) {
        var b = books[i];
        // Bỏ qua các mục không phải sách truyện đọc (show_type 4: quảng cáo/chuyên mục lạ)
        if (b.show_type === "4" || b.show_type === 4) continue;

        var bookName = b.original_title || b.title || "";
        // Loại bỏ thẻ HTML (ví dụ <b><font color="...">...</font></b> trong title highlight)
        bookName = bookName.replace(/<[^>]+>/g, "").trim();

        var bookAuthor = b.original_author || b.author || "";
        var bookCover = b.image_link || "";
        if (bookCover.indexOf("//") === 0) {
            bookCover = "https:" + bookCover;
        }

        var bookIntro = b.intro || "";
        bookIntro = cleanText(bookIntro.replace(/[\r\n\t]+/g, " "));

        var bookId = b.id || "";
        if (bookName && bookId) {
            data.push({
                name: bookName,
                link: BASE_URL + "/shuku/" + bookId + "/",
                cover: bookCover,
                description: bookAuthor ? "Tác giả: " + bookAuthor : bookIntro,
                author: bookAuthor,
                host: BASE_URL
            });
        }
    }

    var next = "";
    if (json.data.meta && json.data.meta.total_page) {
        var totalPage = parseInt(json.data.meta.total_page, 10) || 1;
        if (pageNum < totalPage && data.length > 0) {
            next = (pageNum + 1) + "";
        }
    }

    return Response.success(data, next);
}
