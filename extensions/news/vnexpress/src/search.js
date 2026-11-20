// search.js — danh sach bai cho tab home/genre + tim kiem tu khoa.
// Query bat dau bang "/" hoac "http" thi coi la duong dan chuyen muc,
// khong phai tu khoa. Cham mot bai thi app chay thang article.js voi
// link cua bai (loai news khong co trang detail).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var url = listUrl(query, page);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được danh sách bài: " + url);

    var items = newsItems(doc);
    if (items.length === 0) return Response.success([], "");

    var p = parseInt(page, 10);
    if (!(p >= 1)) p = 1;
    return Response.success(items, String(p + 1));
}
