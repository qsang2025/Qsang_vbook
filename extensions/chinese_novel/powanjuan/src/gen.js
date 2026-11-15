// gen.js — Trang chu (execute(url, page) -> items, next).
//
// Trang chu cua site (kiem chung live 2026-11-16): danh sach
// .books div.bk (20 truyen), h3 co nhan [the loai] + ten + hau to
// "(1-99)"/"(全本)", .booknews co tac gia, p mo ta. page la URL trang
// ke (tuyet doi) do lan goi truoc tra ve; "" = trang dau.
// Trang chu khong co phan trang rieng (chi 1 trang danh sach moi) nen
// next thuong la "".
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url, page) {
    var listUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        listUrl = absUrl(String(page));
    } else {
        var u = String(url || "");
        if (u === "") u = "/";
        listUrl = absUrl(u);
    }
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchPwDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện: " + listUrl);
    }

    var next = nextPageHref(doc);
    return Response.success(items, next);
}
