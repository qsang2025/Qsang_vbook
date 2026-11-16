// toc.js — Muc luc (execute(url) -> [chuong]).
//
// Sach KHONG co "chuong" rieng: toan bo sach phan trang thanh
// /<cat>/<id>.html, /<cat>/<id>_2.html, ... /<cat>/<id>_<N>.html
// (sach mau 27772: 283 trang; sach discovery 27771: 129 trang).
// Tong so trang lay tu totalPagesFromDoc (file helper.js): doc chu
// "共<N>页" trong vung phan trang; fallback: so lon nhat tu link
// _<n>.html. Sinh 第1章...第N章; ch.1 = chinh URL chi tiet.
// KHONG can page.js (toc tra toan bo muc luc 1 lan, khong phan trang).
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

function execute(url) {
    url = normalizeFxUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchFxDoc(url);
    if (r.error) return Response.error(r.error);
    var total = totalPagesFromDoc(r.doc);
    if (!total || total < 1) total = 1;
    var items = [];
    items.push({ name: "第1章", url: url });
    for (var i = 2; i <= total; i++) {
        items.push({
            name: "第" + i + "章",
            url: url.replace(".html", "_" + i + ".html")
        });
    }
    return Response.success(items);
}
