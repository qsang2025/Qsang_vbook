// toc.js — Muc luc chuong cua ZTruyen.
//
// Cach site lay danh sach chuong (tim ra nho phan tich code JS cua site,
// xac minh tu VM 2026-11-13): POST ve /wp-admin/admin-ajax.php,
// action=theme_get_chaps, nonce + storyId trich tu bien StoryAjax tren
// trang chi tiet, 52 chuong/trang, order=ASC, tra
// {success, data:{html, has_more}}. URL chuong lay nguyen tu href
// trong li.chap-item > a.chap-link.
// page.js da tinh so trang tu so chuong moi nhat; toc.js chi POST 1
// trang AJAX theo tham so ztpage trong URL (mac dinh 1). Neu item co
// marker VIP/lock thi danh dau pay/lock + tien to "[VIP] " (phong thu —
// hien site chua co chuong VIP nao, kiem chung 2026-11-13).
//
// Load: build se copy config.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function queryParam(url, key) {
    var q = String(url || "").split("?")[1] || "";
    q = q.split("#")[0];
    var parts = q.split("&");
    for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        if (kv[0] === key) return kv[1] || "";
    }
    return "";
}

function execute(url) {
    var pageNum = parseInt(queryParam(url, "ztpage"), 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var detailUrl = normalizeUrl(url).split("#")[0].split("?")[0];
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl += "/";

    var r = fetchZtruyenPage(detailUrl);
    if (r.error) return Response.error(r.error);

    var ajax = extractStoryAjax(r.rawHtml);
    if (!ajax) return Response.error("Không đọc được mã truyện trên trang chi tiết.");

    var res = fetchChapPage(detailUrl, ajax, pageNum);
    if (res.error) return Response.error(res.error);
    if (!res.items || res.items.length === 0) {
        return Response.error("Không tải được mục lục — truyện này chưa có chương nào.");
    }
    return Response.success(res.items);
}
