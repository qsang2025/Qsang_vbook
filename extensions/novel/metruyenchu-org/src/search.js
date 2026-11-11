// search.js — Tim kiem truyen Metruyenchu.org (metruyenchu.org).
//
// API tim kiem that (kiem chung live 2026-11-11):
//   GET /story/search?type=quick_search&str=<tu khoa>
// Tra ve mot CHUOI JSON chua cac the <a class='list-group-item'>:
//   "<a href='https://metruyenchu.org/dan-chu-loan' class='list-group-item'
//    title='Dẫn Chu Loan'>Dẫn Chu Loan</a>"
// Khong co ket qua thi tra chuoi rong (""). Ket qua khong co bia.
// LUY: trang /tim-kiem?tukhoa=<kw> tra cung 1 danh sach co dinh cho moi
// tu khoa (ke ca tu vo nghia) — KHONG dung duoc. POST /story/search -> 405.
// Neu query la duong dan chuyen muc (bat dau "/" hoac "http") thi coi nhu
// duyet danh sach (phong khi tab nao do tro thang vao search.js).
// Khong co ket qua thi tra danh sach rong (khong phai loi).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";

    if (query.indexOf("http") === 0 || query.indexOf("/") === 0) {
        var listUrl = query.indexOf("http") === 0 ? query : BASE_URL + query;
        var lr = fetchMtcDoc(listUrl);
        if (lr.error) return Response.error(lr.error);
        var litems = parseBookList(lr.doc);
        if (litems.length === 0) return Response.success([], "");
        return Response.success(litems, mtcNextPage(lr.doc));
    }

    if (!query) return Response.error("Nhập từ khóa để tìm truyện.");

    var url = BASE_URL + "/story/search?type=quick_search&str=" + encodeURIComponent(query);
    var r = fetchMtcText(url);
    if (r.error) return Response.error(r.error);
    var payload = null;
    try {
        payload = JSON.parse(r.text);
    } catch (e) {
        return Response.error("Không đọc được kết quả tìm kiếm.");
    }
    if (!payload) return Response.success([], "");

    var items = [];
    var seen = {};
    var re = /<a href='([^']*)'[^>]*title='([^']*)'>([^<]*)<\/a>/g;
    var m = null;
    while ((m = re.exec(payload)) !== null) {
        var link = absUrl(m[1]);
        var name = cleanText(m[3] || m[2]);
        if (!link || !name) continue;
        if (seen[link]) continue;
        seen[link] = true;
        items.push({
            name: name,
            cover: "",
            link: link,
            description: "",
            tag: "",
            host: siteOrigin()
        });
    }
    return Response.success(items, "");
}
