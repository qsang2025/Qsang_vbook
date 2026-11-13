// toc.js — Muc luc chuong cua TruyenChu.
//
// Cach site lay danh sach chuong (tim ra nho phan tich code JS cua site,
// xac minh tu VM 2026-11-13): POST ve {storyUrl}ajax/chapters/,
// body manga=<id> (id trich tu #manga-chapters-holder[data-id] tren
// trang chi tiet; gia tri id khong quan trong — site tra chuong theo
// slug trong URL, gui sai id van tra dung). Tra HTML fragment day du
// 1 lan, khong phan trang (2141 chuong Quang Am Chi Ngoai, 1992 chuong
// Muc Than Ky), chuong moi nhat truoc — dao nguoc ve chuong 1 truoc.
// POST khong body tra 400 (xem helper.js). Neu item co marker VIP/lock
// thi danh dau pay/lock + tien to "[VIP] " (phong thu — hien site chua
// co chuong VIP nao, kiem chung 2026-11-13).
//
// Load: build se copy config.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url).split("#")[0].split("?")[0];
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl += "/";

    var r = fetchTruyenchuPage(detailUrl);
    if (r.error) return Response.error(r.error);

    var mangaId = extractMangaId(r.doc, r.rawHtml);
    var res = fetchTocAjax(detailUrl, mangaId);
    if (res.error) return Response.error(res.error);
    if (!res.items || res.items.length === 0) {
        return Response.error("Không tải được mục lục — truyện này chưa có chương nào.");
    }
    return Response.success(res.items);
}
