// search.js — tim kiem video theo tu khoa qua API cong khai Dailymotion.
// GET https://api.dailymotion.com/videos?search=<q>&page=<n>&limit=20
//     &fields=id,title,description,duration,thumbnail_720_url,owner.screenname
// (da kiem chung 2026-11-06: 20 ket qua/trang, has_more=true, trang 2
// khong trung trang 1). Token trang ke = so trang dang chuoi, "" khi het.
// Dong thoi la script danh sach cho tab home/genre (input la tu khoa
// da chon san).
//
// Load: build se copy config.js, config-helpers.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");
    page = page || "1";
    var num = parseInt(page, 10);
    if (isNaN(num) || num < 1) num = 1;

    var url = API_BASE + "/videos?search=" + encodeURIComponent(query) +
        "&page=" + num + "&limit=20" +
        "&fields=id,title,description,duration,thumbnail_720_url,owner.screenname";
    var data = dmApiGet(url);
    if (!data || !data.list) return Response.error("Không tải được kết quả tìm kiếm: " + query);

    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < data.list.length; i++) {
        var item = videoItem(data.list[i]);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }

    if (items.length === 0) return Response.error("Không tìm thấy video nào cho từ khóa: " + query);
    var next = data.has_more ? String(num + 1) : "";
    return Response.success(items, next);
}
