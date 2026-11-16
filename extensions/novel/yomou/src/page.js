// page.js — Danh sach cac trang muc luc cua 1 truyen (execute(url) ->
// [urlTrangMucLuc]). Trang chi tiet chi hien 100 chuong/trang (?p=N)
// nen so trang = ceil(tongSoChuong / 100), lay tongSoChuong tu API.
// Truyen ngan hoac <= 100 chuong: chi 1 trang (chinh URL vao, bo query).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeSyUrl(url);
    if (!detailUrl) return Response.error("Không có đường dẫn truyện.");
    var baseUrl = detailUrl.replace(/[?].*$/, "").replace(/\/+$/, "") + "/";
    var ncode = extractNcode(baseUrl);
    if (!ncode) return Response.error("Không đọc được mã truyện từ đường dẫn.");
    var r = fetchSyJson(queryBuilder({ ncode: ncode, of: "t-n-nt-ga" }));
    if (r.error) return Response.error(r.error);
    var json = r.json;
    if (json.length < 2 || !json[1]) return Response.error("Không tìm thấy truyện.");
    var novel = json[1];
    if (novel.noveltype === 2) return Response.success([baseUrl]);
    var total = 0;
    try { total = parseInt(novel.general_all_no, 10); } catch (e) { total = 0; }
    if (isNaN(total) || total <= 0) total = 1;
    var pages = Math.ceil(total / 100);
    var out = [];
    for (var i = 1; i <= pages; i++) {
        if (i === 1) out.push(baseUrl);
        else out.push(baseUrl + "?p=" + i);
    }
    return Response.success(out);
}
