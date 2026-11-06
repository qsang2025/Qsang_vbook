// search.js — tim kiem theo tu khoa cua App Truyen Chu.
// Site tim kiem bang /truyen?keyword=<tu khoa> (URL-encode UTF-8), dung
// chung giao dien trang /truyen: 20 truyen/trang, phan trang ?page=N
// (khao sat 2026-11-06, tu khoa "he thong" tra ve truyen mau o vi tri 8).
// Neu query la duong dan (/truyen?... hoac URL day du) thi duyet thang
// trang do nhu mot tab danh sach.
//
// LUU Y phan trang tim kiem (bug sua o v4, 2026-11-06): trang ket qua tim
// kiem theo tu khoa KHONG render link phan trang ?page=N trong HTML nen
// parseListPage (tinh trang ke tu link pager lon nhat) luon tra next rong
// — tim kiem ket o trang 1 du server van phan trang (?page=2 tra 20
// truyen moi). Vi vay khi trang du 20 muc ma khong tim thay link phan
// trang thi DO THU trang ke (fetch 1 lan, chi chap nhan khi co muc MOI
// chua co o trang hien tai). Khong dung meo "du 20 muc thi chac con trang"
// (meo do sinh trang trong khi tong dung boi so cua 20, va khong phat
// hien duoc server tra lai trang 1 khi vuot qua trang cuoi).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var cur = parseInt(page, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    var baseUrl = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Duyet tab: query la duong dan chuyen muc hoac URL day du.
        baseUrl = query.indexOf("http") === 0 ? query : BASE_URL + query;
    } else {
        // Tu khoa: /truyen?keyword=
        baseUrl = BASE_URL + "/truyen?keyword=" + encodeURIComponent(query);
    }
    var url = pagedUrl(baseUrl, String(cur));

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var parsed = parseListPage(doc, String(cur));
    if (!parsed.next && parsed.items.length >= 20) {
        // Khong thay link phan trang ma trang du muc: do thu trang ke.
        var nextDoc = fetchDoc(pagedUrl(baseUrl, String(cur + 1)));
        if (nextDoc) {
            var seenNow = {};
            var k = 0;
            for (k = 0; k < parsed.items.length; k++) seenNow[parsed.items[k].link] = true;
            var hasNew = false;
            nextDoc.select("a[href]").forEach(function (a) {
                if (hasNew) return;
                var it = parseBookCard(a);
                if (it && !seenNow[it.link]) hasNew = true;
            });
            if (hasNew) parsed.next = String(cur + 1);
        }
    }
    return Response.success(parsed.items, parsed.next);
}
