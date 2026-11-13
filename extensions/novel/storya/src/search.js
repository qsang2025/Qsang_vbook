// search.js — tim kiem theo tu khoa (execute(key, page) -> items, nextPage).
//
// Site tim bang GET /vi/search?q=<kw> (cung layout danh sach nhu gen.js).
// LUU Y: site chi tra ket qua dung khi go CO DAU (vd "chư thần ngu hí"
// tra dung "Chư Thần Ngu Hí"); go khong dau tra ket qua mo/khong lien
// quan; tu khoa vo nghia tra rong. Tim kiem khong phan trang that
// (&page=N tra lai cung ket qua) nen data2 luon "".
// Tu khoa tieng Viet co dau — encode UTF-8 (encodeURIComponent; fallback
// ma hoa tay khi runtime khong co ham do).
//
// Tai len: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
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
    var target = BASE_URL + "/vi/search?q=" + encodeKey(k);
    var r = fetchStoryaDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var data = parseStories(doc);
    if (data.length === 0) return Response.error("Không tìm thấy \"" + k + "\" (thử gõ có dấu)");
    return Response.success(data, "");
}
