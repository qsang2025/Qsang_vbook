// gen.js — Trang the loai (execute(url, page) -> items, next).
//
// Trang the loai /txt/<cat>/ (kiem chung live 2026-11-16 voi
// /txt/xuanhuan/, /txt/kongbu/, /txt/gdmz/ va 4 the loai khac):
// .catalog .listbg (10 truyen/trang), phan trang /txt/<cat>/index_<N>.html,
// link 下一页. page la URL trang ke (tuyet doi) do lan goi truoc tra ve;
// "" = trang dau.
// Home tab va genre deu tro ve script nay.
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

function execute(url, page) {
    var listUrl = "";
    if (page !== undefined && page !== null && String(page) !== "") {
        listUrl = absUrl(String(page));
    } else {
        var u = String(url || "");
        if (u === "") u = "/txt/xuanhuan/";
        listUrl = absUrl(u);
    }
    if (!listUrl) return Response.error("Đường dẫn danh sách không hợp lệ.");
    var r = fetchIjDoc(listUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = parseItemList(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện: " + listUrl);
    }

    var next = nextPageHref(doc);
    return Response.success(items, next);
}
