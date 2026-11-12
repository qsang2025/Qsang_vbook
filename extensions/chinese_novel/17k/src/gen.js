// gen.js — danh sach truyen cua mot bang xep hang (API rank cua 17k).
// Input la URL template tu home.js (co ${page} va ${appKey}).
// API tra JSON {status:{code:0}, data:[...], curPage, totalPage, hasMore}.
// 20 truyen/trang. Item: bookName, id -> /book/<id>.html,
// coverImg, authorPenName, categoryName.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    if (!page) page = "1";
    url = url.replace("${page}", page).replace("${appKey}", String(APP_KEY));
    var response = fetchPage(url, { headers: { "Accept": "application/json, */*" } });
    if (!response || !response.ok) return Response.error("Không tải được bảng xếp hạng (HTTP " + (response ? response.status : 0) + ")");
    var text = "";
    try {
        text = response.text();
    } catch (e) {
        return Response.error("Không đọc được dữ liệu bảng xếp hạng");
    }
    var j = null;
    try {
        j = JSON.parse(text);
    } catch (e) {
        return Response.error("Dữ liệu bảng xếp hạng không phải JSON");
    }
    if (!j || !j.status || j.status.code !== 0) return Response.error("Bảng xếp hạng trả lỗi" + (j && j.status && j.status.msg ? ": " + j.status.msg : ""));
    var data = [];
    var items = j.data || [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item || !item.id) continue;
        data.push({
            name: item.bookName || "",
            link: BASE_URL + "/book/" + item.id + ".html",
            cover: item.coverImg || "",
            description: item.authorPenName || "",
            tag: item.categoryName || "",
            host: BASE_URL
        });
    }
    var next = "";
    if (j.hasMore === 1 || j.hasMore === true) {
        next = (parseInt(page, 10) + 1).toString();
    }
    return Response.success(data, next);
}
