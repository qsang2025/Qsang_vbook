// suggest.js — Truyen de xuat cung the loai voi truyen dang xem.
// Input la URL trang chi tiet; lay slug the loai tu URL roi doc trang 1
// cua the loai do. KHONG tim theo tac gia: GET /search/?keyword= cua site
// chi tra trang form (0 ket qua).
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

var CATEGORY_RE = /\/(dsyq|wxxz|xhqh|cyjk|khjj|ghxy|jsls|guanchang|xtfq|dmtr|trxs|jqxs)\//;

function execute(url) {
    var m = CATEGORY_RE.exec(String(url || ""));
    if (!m) return Response.success([]);
    var r = fetchBxDoc(paginateUrl(m[1], 1));
    if (r.error) return Response.success([]);
    var items = parseListItems(r.doc);
    return Response.success(items || []);
}
