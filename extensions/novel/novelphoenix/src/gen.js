// gen.js — Danh sach truyen theo tab home / the loai.
//
// Input: duong dan danh sach dang /latest-release-novel, /new-novel,
// /hot-novel, /most-popular, /completed-novel, /genre/<Ten>.
// Phan trang: token trang = so trang 1-based; URL trang ke tiep them
// ?page=<N>. Moi trang 22 truyen (div.li).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(input, page) {
    input = input || "";
    page = page || "1";
    if (!input) return Response.error("Thiếu đường dẫn danh sách");
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var path = input;
    if (path.indexOf("http") === 0) {
        var mm = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = mm ? mm[1] : path;
    }
    // Bo ?page= cu neu input da kem (tranh ?page=2&page=3).
    var qm = path.indexOf("?");
    if (qm !== -1) path = path.substring(0, qm);

    var url = absUrl(pageUrl(path, pageNum));
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var items = parseNovelItems(rr.doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + url);

    var next = nextPageToken(rr.doc, pageNum);
    return Response.success(items, next);
}
