// search.js — Tim kiem truyen tren Sang Tac Viet
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }
    page = page ? String(page) : '1';
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var url = BASE_URL + "/io/searchtp/searchBooks?find=&findinname=" + encodeURIComponent(String(key).trim()) + "&minc=0&p=" + pageNum + "&tag=";

    var response = null;
    try {
        response = fetchWithMirrors(url);
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
    }
    if (!response || !response.ok) {
        var blockedMsg = stvBlockedMessage();
        if (blockedMsg) return Response.error(blockedMsg);
        var gwMsg = stvGatewayErrorMessage(response ? response.status : 0);
        if (gwMsg) return Response.error(gwMsg);
        return Response.error("Không tải được kết quả tìm kiếm (HTTP " + (response ? response.status : 0) + ")");
    }
    var doc = response.html();

    // Parse chung voi gen.js (helper.js). 0 ket qua la ket qua binh
    // thuong, khong phai loi: tra success rong thay vi error (C2).
    var result = parseSearchPage(doc, pageNum);
    return Response.success(result.data, result.next);
}
