// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Form tim kiem tren trang chu: GET /zhao/?keyword=<tu khoa> (kiem chung
// form tren trang chu live 2026-11-16). Ket qua dung bo cuc .item nhu
// trang the loai (xem file helper.js).
// CANH BAO: tu VM, GET /zhao/?keyword= tra trang 验证码 (captcha cua site).
// Neu tren may that cung bi chan thi bo search.js theo tien le Sách Hay
// Online / 17k — chap.js + toc.js + detail.js van chay duoc.
// Phan trang: tim link .page co "page="; khong co thi het.
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

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Hãy nhập từ khóa tìm kiếm.");
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var url = "";
    if (pRaw !== "") {
        url = normalizeIxUrl(pRaw);
    } else {
        url = BASE_URL + "/zhao/?keyword=" + encodeURIComponent(k);
    }
    if (!url) return Response.error("Đường dẫn tìm kiếm không hợp lệ.");
    var r = fetchIxDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var title = String(doc.select("title").text() || "");
    if (title.indexOf("验证码") !== -1) {
        return Response.error("Tìm kiếm cần xác minh trên web — hãy mở ixunshu.net trong trình duyệt của app một lần rồi thử lại.");
    }
    var items = parseListItems(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy \"" + k + "\"");
    }
    var next = "";
    var pager = doc.select(".page a");
    for (var i = 0; i < pager.size(); i++) {
        var href = String(pager.get(i).attr("href") || "");
        if (href.indexOf("page=") !== -1) {
            next = absUrl(href);
            break;
        }
    }
    return Response.success(items, next);
}
