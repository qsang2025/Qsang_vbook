// gen.js — Danh sach truyen theo tab home / the loai.
//
// Input: duong dan danh sach dang /browse?sort=<name|popular|date>
// &status=<0|1|2> (co the kem &genre[]=<id>). Phan trang: token trang
// = so trang 1-based; URL trang ke tiep them &p=<N>. Moi trang
// 30 truyen (div.manga-block.mt-2.mb-3).
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
    // Bo &p= / ?p= cu neu input da kem (tranh ?p=2&p=3).
    path = path.replace(/([?&])p=\d+/, "$1").replace(/[?&]$/, "");

    var url = absUrl(pageUrl(path, pageNum));
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var items = parseNovelItems(rr.doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + url);

    var next = nextPageToken(rr.doc, pageNum);
    return Response.success(items, next);
}
