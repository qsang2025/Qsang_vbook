// gen.js — Danh sach truyen Sang Tac Viet
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
        response = fetchWithMirrors(url);
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
    }
    if (!response || !response.ok) return Response.error("Không tải được danh sách truyện (HTTP " + (response ? response.status : 0) + ")");
    var doc = response.html();

    // Parse chung voi search.js (helper.js). Trang list trong la ket qua
    // binh thuong, khong phai loi: tra success rong thay vi error (C2)
    // — tranh truong hop trang cuoi du 48 muc sinh nextToken tro toi
    // trang trong roi hien man hinh loi thay vi het danh sach.
    var result = parseSearchPage(doc, pageNum);
    return Response.success(result.data, result.next);
}
