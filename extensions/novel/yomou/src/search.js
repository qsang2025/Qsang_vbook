// search.js — Tim kiem theo tieu de qua API tieu thuyet
// (execute(key, page) -> items, next). Tim trong TIEU DE (title=1,
// theo base v6 — chinh xac, it rac); page la offset st (chuoi so).
// Moi trang 100 muc; con ket qua thi tra next = offset ke (chuoi).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Hãy nhập từ khóa tìm kiếm.");
    var st = 0;
    var pRaw = String(page === undefined || page === null ? "" : page).replace(/\s/g, "");
    if (pRaw !== "") {
        var pn = parseInt(pRaw, 10);
        if (!isNaN(pn) && pn >= 0) st = pn;
    }
    var apiUrl = queryBuilder({ title: 1, word: encodeURIComponent(k), of: API_FIELDS_LIST, lim: 100 });
    if (st > 0) apiUrl = apiUrl + "&st=" + st;
    var r = fetchSyJson(apiUrl);
    if (r.error) return Response.error(r.error);
    var json = r.json;
    if (json.length < 2) return Response.error("Không tìm thấy \"" + k + "\"");
    var allcount = 0;
    try { allcount = parseInt(json[0].allcount, 10); } catch (e) { allcount = 0; }
    if (isNaN(allcount)) allcount = 0;
    var items = [];
    for (var i = 1; i < json.length; i++) {
        var one = parseApiNovel(json[i]);
        if (one !== null) items.push(one);
    }
    if (items.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");
    var next = "";
    if (allcount > 0 && st + items.length < allcount) {
        next = String(st + items.length);
    }
    return Response.success(items, next);
}
