// search.js — Tim kiem truyen Metruyenhotvn (metruyenhotvn.com).
//
// API tim kiem THAT (kiem chung live 2026-11-11): API goi y cua o tim
// kiem tren site:
//   GET /ajax/suggest-story?q=<tu khoa>
// Tra ve mang JSON [{name, url}] (VD q=long than -> 5 ket qua, ket qua
// dau "Long Thần Thượng Cổ - Tư Tuyết Y (FULL)", url "/long-than-thuong-co/").
// Khong co ket qua thi tra mang rong ([]). Ket qua khong co bia.
// LUU Y: form tim kiem /tim-truyen?q=<kw> tra ve trang chu rong cho moi
// tu khoa (ke ca tu khoa co that) — KHONG dung duoc; POST /tim-truyen
// tra 500. Chi co suggest-story la tim kiem that.
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
        var lr = fetchMthDoc(listUrl);
        if (lr.error) return Response.error(lr.error);
        var litems = parseBookList(lr.doc);
        if (litems.length === 0) return Response.success([], "");
        return Response.success(litems, mthNextPage(lr.doc));
    }

    if (!query) return Response.error("Nhập từ khóa để tìm truyện.");

    var url = BASE_URL + "/ajax/suggest-story?q=" + encodeURIComponent(query);
    var r = fetchMthText(url);
    if (r.error) return Response.error(r.error);
    var payload = null;
    try {
        payload = JSON.parse(r.text);
    } catch (e) {
        return Response.error("Không đọc được kết quả tìm kiếm.");
    }
    if (!payload || !(payload instanceof Array)) return Response.success([], "");

    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < payload.length; i++) {
        var entry = payload[i] || {};
        var link = absUrl(entry.url || "");
        var name = cleanText(entry.name || "");
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
