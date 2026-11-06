// search.js — tim kiem theo tu khoa + renderer danh sach cho tab
// home/genre. Query bat dau bang "/" hoac "http" thi coi la duong dan
// danh sach cua API, khong phai tu khoa. Phan trang theo
// data.params.pagination cua API (totalPages), next = "" khi het.
//
// Load: build se copy config.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";

    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Duyet tab: query la duong dan danh sach cua API hoac URL day du.
        url = query.indexOf("http") === 0 ? query : BASE_URL + query;
    } else {
        // Tu khoa: /v1/api/tim-kiem?keyword=
        url = BASE_URL + "/v1/api/tim-kiem?keyword=" + encodeURIComponent(query);
    }
    url = apiPagedUrl(url, page);

    var json = fetchJson(url);
    if (!json) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var parsed = listItems(json);
    if (parsed.items.length === 0) return Response.error("Không tìm thấy phim nào: " + query);
    return Response.success(parsed.items, parsed.next);
}
