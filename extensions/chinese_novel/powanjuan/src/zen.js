// zen.js — Trang the loai / xep hang (execute(url, page) -> items, next).
//
// Trang the loai cua site (kiem chung live 2026-11-16 voi /tongren/ va
// /sort/): ul.clearfix li (15 truyen/trang), strong > a ten + hau to
// "(1-99)"/"(全本)", .descript mo ta, .tips (tac gia / dung luong /
// ngay); phan trang /<duong>/index_<N>.html, link 下一页.
// page la URL trang ke (tuyet doi) do lan goi truoc tra ve; "" = trang dau.
// Base Moleys v1 dung bo cuc nay nhung lay next token bang cach tach
// chuoi de vo (split + pop) va khong xu ly truong hop het trang — viet
// lai dung nextPageHref() tra URL day du.
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
        if (u === "") u = "/tongren/";
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
