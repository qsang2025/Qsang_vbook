// search.js — Tim kiem theo tu khoa (execute(query, page) -> items).
//
// Tim kiem qua GET https://s.sfacg.com/?Key=<tu khoa>&S=1&SS=0 (kiem
// chung live 2026-11-16 tu VM: 200, tra dung sach mau). Ket qua co 2
// bang table.comic_cover — bang DAU la truyen tranh, bang CUOI moi la
// tieu thuyet (5 link /Novel/ o trang mau) nen lay bang cuoi.
// Khong phan trang: page != "" tra danh sach rong (nhu base).
// Site dung UTF-8 nen tu khoa encodeURIComponent binh thuong.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(query, page) {
    page = String(page || "");
    if (page !== "") {
        return Response.success([], "");
    }
    query = String(query || "").trim();
    if (!query) return Response.error("Hãy nhập từ khóa tìm kiếm.");

    var url = "https://s.sfacg.com/?Key=" + encodeURIComponent(query) + "&S=1&SS=0";
    var r = fetchSfDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var tables = doc.select("table.comic_cover");
    if (tables.size() === 0) {
        return Response.error("Không tìm thấy \"" + query + "\"");
    }
    var last = tables.get(tables.size() - 1);
    var items = [];
    var seen = {};
    var uls = last.select("ul");
    for (var i = 0; i < uls.size(); i++) {
        var one = parseBookCard(uls.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + query + "\"");
    }
    return Response.success(items, "");
}
