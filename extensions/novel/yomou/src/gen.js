// gen.js — Danh sach truyen tu API tieu thuyet (execute(url, page) ->
// items, next). URL la URL API day du (tu home/genre/detail-genres);
// page la offset st (chuoi so, "" = trang dau). Moi trang 100 muc
// (lim trong URL); con ket qua thi tra next = offset ke (chuoi).
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
    var st = 0;
    var pRaw = String(page === undefined || page === null ? "" : page).replace(/\s/g, "");
    if (pRaw !== "") {
        var pn = parseInt(pRaw, 10);
        if (!isNaN(pn) && pn >= 0) st = pn;
    }
    var apiUrl = url;
    if (st > 0 && apiUrl.indexOf("st=") === -1) {
        apiUrl = apiUrl + (apiUrl.indexOf("?") === -1 ? "?" : "&") + "st=" + st;
    }
    var r = fetchSyJson(apiUrl);
    if (r.error) return Response.error(r.error);
    var json = r.json;
    if (json.length < 2) return Response.error("Không tìm thấy truyện.");
    var allcount = 0;
    try { allcount = parseInt(json[0].allcount, 10); } catch (e) { allcount = 0; }
    if (isNaN(allcount)) allcount = 0;
    var items = [];
    for (var i = 1; i < json.length; i++) {
        var one = parseApiNovel(json[i]);
        if (one !== null) items.push(one);
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện.");
    var next = "";
    if (allcount > 0 && st + items.length < allcount) {
        next = String(st + items.length);
    }
    return Response.success(items, next);
}
