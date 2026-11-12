// search.js — Tim kiem truyen tren QuanBen (quanben5.com).
//
// Tim kiem qua JSONP cong khai cua site (trang /search.html goi ham
// load_more() — kiem chung live 2026-11-12):
//   /?c=book&a=search.json&callback=search&t=<ms>&keywords=<kw>&b=<b>
// - keywords: tu khoa (encodeURI).
// - b: ham base64 rieng cua site ap cho encodeURI(keywords) — server
//   KIEM TRA b, gui sai se tra "参数错误！5" (xem qbBase64 trong helper.js).
// - Tra ve: search({"id":0,"content":"<div class=\"pic_txt_list\">..."
//   — content la HTML cac ket qua, parse nhu trang danh sach.
// - KHONG co phan trang (1 lan goi tra toan bo ket qua) nen data2 luon "".
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Hãy nhập từ khóa để tìm truyện.");
    var enc = encodeURI(query);
    var b = qbBase64(enc);
    var url = BASE_URL + "/?c=book&a=search.json&callback=search&t=" + new Date().getTime() + "&keywords=" + enc + "&b=" + encodeURIComponent(b);

    var r = fetchQBText(url, BASE_URL + "/search.html");
    if (r.error) return Response.error(r.error);
    var text = r.text || "";
    var start = text.indexOf("(");
    var end = text.lastIndexOf(")");
    if (start === -1 || end <= start) return Response.error("Không đọc được kết quả tìm kiếm (site có thể đã đổi giao diện).");
    var content = "";
    try {
        var payload = JSON.parse(text.substring(start + 1, end));
        content = payload.content || "";
    } catch (e) {
        return Response.error("Không đọc được kết quả tìm kiếm (site có thể đã đổi giao diện).");
    }
    if (!content) return Response.success([], "");
    var doc = Html.parse(content);
    var items = parseBookList(doc);
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, "");
}
