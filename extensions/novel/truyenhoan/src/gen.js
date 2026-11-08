// gen.js — Danh sach truyen theo danh muc / the loai
load('config.js');

function normalizeCategoryInput(input) {
    if (input === null || input === undefined) return "";
    var s = String(input).trim();
    if (!s) return "";
    s = s.replace(/^\/+/, "");
    s = s.replace(/\/+$/, "");
    return s;
}

function execute(input, page) {
    page = page ? String(page) : "1";

    var raw = normalizeCategoryInput(input);
    if (!raw) {
        return Response.error("Thiếu danh mục hoặc thể loại.");
    }

    var url = BASE_URL + "/" + raw + "/";
    if (page !== "1") {
        url = BASE_URL + "/" + raw + "/trang-" + page + "/";
    }

    var response = safeFetch(url);
    if (!response) return Response.error("Không kết nối được tới " + BASE_URL + ".");
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var novels = parseNovelRows(doc);
    if (novels.length === 0) {
        return Response.error("Không tìm thấy truyện trên trang.");
    }

    var nextPage = findNextPage(doc);
    return Response.success(novels, nextPage);
}
