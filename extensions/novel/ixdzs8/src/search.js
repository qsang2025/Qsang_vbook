// search.js — tim kiem theo tu khoa cua 爱下电子书 (ixdzs8.com).
// GET /bsearch?q=<urlencoded>&page=<N> (da kiem chung 2026-11-09:
// tim "诡秘之主" ra 20 ket qua/trang, 3 trang, toan truyen dong nhan —
// ten sach co the khong khop chinh xac, extension hien dung ten nhu
// trang tra ve, khong tu loc; tim "剑来" ra dung "剑来" dau tien).
// Ket qua: ul.u-list > li.burl (cung cau truc dong truyen nhu trang
// danh sach — xem helper.js parseBookRows).
// Phan trang: nut ke la div.pagei a[title="下一页"]; token trang ke tra
// ve la PATH cua link ke, luot sau nhan page bat dau bang "/" thi fetch
// thang path do.
// Du phong: neu site redirect thang ve trang chi tiet (trang co meta
// og:novel:book_name — chua gap tren ixdzs8 nhung de phong nhu sto9),
// tra ve 1 item duy nhat lay tu OG meta.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var url = "";
    if (page && page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        url = BASE_URL + page;
    } else {
        var n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        url = BASE_URL + "/bsearch?q=" + encodeURIComponent(query) + "&page=" + n;
    }

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    // Redirect ve trang chi tiet (trang detail co meta
    // og:novel:book_name, trang ket qua thi khong): tra 1 item tu OG meta.
    var ogName = doc.select('meta[property="og:novel:book_name"]').first();
    if (ogName !== null) {
        var name = cleanText(ogName.attr("content"));
        if (name) {
            var ogImg = doc.select('meta[property="og:image"]').first();
            var ogAuthor = doc.select('meta[property="og:novel:author"]').first();
            var ogLatest = doc.select('meta[property="og:novel:latest_chapter_name"]').first();
            var ogStatus = doc.select('meta[property="og:novel:status"]').first();
            var cover = "";
            if (ogImg !== null) {
                cover = ogImg.attr("content") || "";
                if (cover.indexOf("nocover") !== -1) cover = "";
                else if (cover) cover = absUrl(cover);
            }
            var item = {
                name: htmlDecode(name),
                cover: cover,
                link: url,
                description: ogLatest !== null ? cleanText(ogLatest.attr("content")) : "",
                tag: ogStatus !== null ? cleanText(ogStatus.attr("content")) : "",
                host: siteOrigin()
            };
            if (ogAuthor !== null) {
                var au = cleanText(ogAuthor.attr("content"));
                if (au) item.description = au + (item.description ? " — " + item.description : "");
            }
            return Response.success([item], "");
        }
    }

    var items = parseBookRows(doc);
    return Response.success(items, nextPagePath(doc));
}
