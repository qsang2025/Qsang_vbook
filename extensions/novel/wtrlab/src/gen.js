// gen.js — Danh sach truyen tu __NEXT_DATA__ cua trang danh sach /
// xep hang (execute(url, page) -> items, next). URL la URL trang day du
// (tu home/genre/detail-genres): /en/novel-list[?genre=N] hoac
// /en/ranking/daily|weekly|monthly. page la so trang 0-based (chuoi,
// "" = trang dau, 0). Moi trang 10 muc; con ket qua thi tra next = so
// trang ke (chuoi). Trang danh sach cua site dung ?page=N 0-based
// (kiem chung: ?page=11295 tra 7 muc cuoi voi count 112947).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url, page) {
    url = String(url === undefined || url === null ? "" : url).trim();
    if (!url) return Response.error("Không có đường dẫn danh sách.");
    var pageNum = 0;
    var pRaw = String(page === undefined || page === null ? "" : page).replace(/\s/g, "");
    if (pRaw !== "") {
        var pn = parseInt(pRaw, 10);
        if (!isNaN(pn) && pn >= 0) pageNum = pn;
    }
    // Bo tham so page cu neu URL vao da co (tab/the loai khong bao gio co),
    // roi ghep ?page=<so trang 0-based>.
    var base = url.replace(/([?&])page=\d+/g, "$1").replace(/[?&]$/, "");
    var listUrl = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + pageNum;

    var r = pacedFetch(listUrl, {
        method: "GET",
        headers: { "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        timeout: 20000,
        maxRetries: 2
    });
    if (!r.ok) {
        if (r.error === "cooldown" || r.status === 429 || r.status === 405) {
            return Response.error(rateLimitErrorMessage("WTR-LAB", "wtr-lab.com", r.cooldownRemainingMs));
        }
        if (r.status) return Response.error("Không tải được danh sách (HTTP " + r.status + ").");
        return Response.error("Không kết nối được tới WTR-LAB, hãy kiểm tra mạng rồi thử lại.");
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e) {
        return Response.error("Không đọc được danh sách.");
    }
    var nd = extractNextData(text);
    if (!nd || !nd.props || !nd.props.pageProps) {
        return Response.error("Không đọc được danh sách.");
    }
    var pp = nd.props.pageProps;
    var series = pp.series || pp.list || null;
    if (!series) return Response.error("Không tìm thấy truyện.");
    var count = 0;
    try { count = parseInt(pp.count, 10); } catch (e2) { count = 0; }
    if (isNaN(count)) count = 0;
    var items = [];
    var i = 0;
    for (i = 0; i < series.length; i++) {
        var one = parseSerieItem(series[i]);
        if (one !== null) items.push(one);
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện.");
    var next = "";
    if (count > 0 && (pageNum + 1) * 10 < count) {
        next = String(pageNum + 1);
    } else if (count === 0 && items.length === 10) {
        next = String(pageNum + 1);
    }
    return Response.success(items, next);
}
