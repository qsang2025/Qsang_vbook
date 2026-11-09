// gen.js — Danh sach truyen SangtacvietApp
load('config.js');
load('helper.js');

function execute(param, page) {
    page = page ? String(page) : '1';
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var query = param || "sort=update";
    var url = BASE_URL + "/io/searchtp/searchBooks?find=&minc=0&" + query + "&p=" + pageNum + "&tag=";

    var response = null;
    try {
        response = fetchWithMirrors(url, {
            headers: {
                "x-stv-transport": "app",
                "x-requested-with": "com.sangtacviet.mobilereader"
            }
        });
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
    }
    if (!response || !response.ok) return Response.error("Không tải được danh sách truyện (HTTP " + (response ? response.status : 0) + ")");
    var rawText = "";
    try {
        rawText = response.text();
    } catch (eText) {
        rawText = "";
    }

    var result = parseSearchPage(rawText || response.html(), pageNum);
    return Response.success(result.data, result.next);
}
