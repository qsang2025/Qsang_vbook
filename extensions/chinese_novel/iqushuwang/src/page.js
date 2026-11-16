// page.js — Phan trang muc luc (execute(url) -> [URL trang muc luc]).
//
// Muc luc phan trang 20 chuong/trang (kiem chung live 2026-11-16):
// - Trang chi tiet /book/<id>/ = trang 1 (ch.1-20).
// - /book/<id>/<n>/ = trang n+1 (vd. /book/1389/1/ = trang 2,
//   header "《宫廷生存纪事》目录 （第2页/共4页）").
// - /book/<id>/0/ 301 ve trang chi tiet (khong co trang 0 rieng).
// Tong so trang doc tu header "共N页" tren /book/<id>/1/; neu khong
// co (sach <= 20 chuong) thi chi co trang chi tiet.
// Tra it nhat 1 URL; moi trang deu phai co chuong.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeIqUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var id = bookId(url);
    if (!id) return Response.error("Đường dẫn truyện không hợp lệ.");

    var pages = [url];
    var probe = fetchIqDoc(BASE_URL + "/book/" + id + "/1/");
    if (probe.error) return Response.success(pages);
    var bodyText = String(probe.doc.select("body").text() || "");
    var m = bodyText.match(/第\s*\d+\s*页\s*\/\s*共\s*(\d+)\s*页/);
    if (!m) return Response.success(pages);
    var total = parseInt(m[1], 10);
    if (isNaN(total) || total < 2) return Response.success(pages);
    for (var i = 1; i < total; i++) {
        pages.push(BASE_URL + "/book/" + id + "/" + i + "/");
    }
    return Response.success(pages);
}
