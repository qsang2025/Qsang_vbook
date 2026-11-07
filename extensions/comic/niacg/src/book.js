// book.js — doc 1 trang danh sach cua NiACG (tab home/genre, trang tag).
//
// Input: duong dan danh sach, vd "/listinfo-3-0.html" (muc 本子) hoac
// "/tags-<tu khoa>-0.html" (trang tag). Page: so trang cua app (bat dau
// tu 1); site bat dau tu 0 nen trang app N = trang site N-1 (xem
// listPageUrl trong helper.js).
// Moi trang 60 item; dong item la .list-col (xem parseGalleryRow).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(input, page) {
    input = input || "";
    page = page || "1";
    if (!input) return Response.error("Thiếu đường dẫn danh sách.");

    var baseUrl = input.indexOf("http") === 0 ? input : BASE_URL + input;
    var url = listPageUrl(baseUrl, page);

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang danh sách: " + url);

    var parsed = parseListPage(doc, page);
    if (parsed.items.length === 0) {
        return Response.error("Không đọc được danh sách (site có thể đã đổi giao diện): " + url);
    }
    return Response.success(parsed.items, parsed.next);
}
