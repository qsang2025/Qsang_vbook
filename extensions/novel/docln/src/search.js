// search.js — tim kiem theo tu khoa (execute(key, page) -> items, nextPage).
//
// Site tim bang GET /tim-kiem?keywords=<kw>&page=N (25 ket qua/trang,
// phan trang ?page=N 1-based, cung layout danh sach nhu gen.js).
// Tu khoa tieng Viet co dau — encode UTF-8 (encodeURIComponent; fallback
// ma hoa tay khi runtime khong co ham do).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function encodeKey(k) {
    try {
        return encodeURIComponent(k);
    } catch (e) {
        return String(k).replace(/[^A-Za-z0-9\-_.~]/g, function (ch) {
            var code = ch.charCodeAt(0);
            if (code < 128) return "%" + ("0" + code.toString(16)).slice(-2).toUpperCase();
            return ch;
        });
    }
}

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Thiếu từ khoá tìm kiếm");
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(pRaw, 10);
    if (isNaN(pn) || pn < 1) pn = 1;

    var target = BASE_URL + "/tim-kiem?keywords=" + encodeKey(k) + "&page=" + pn;
    var r = fetchDoclnDoc(target);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var data = parseListItems(doc);
    if (data.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");

    var next = "";
    var mp = maxPage(doc);
    if (mp > 0 && pn < mp) next = String(pn + 1);
    return Response.success(data, next);
}
