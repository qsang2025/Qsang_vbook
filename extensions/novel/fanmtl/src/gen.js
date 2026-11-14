// gen.js — Danh sach truyen theo tab home / the loai.
//
// Input: duong dan danh sach dang /list/<theloai>/<trangthai>-<sapxep>-<N>.html
// (N = 0 o trang 1). Phan trang: token trang = so trang 1-based; URL trang
// ke tiep doi hau to -<N>.html. Moi trang 30 truyen (li.novel-item).
// Token trang sau chi tra khi tim thay link phan trang toi trang ke tiep.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(input, page) {
    input = input || "";
    page = page || "1";
    if (!input) return Response.error("Thiếu đường dẫn danh sách");
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var path = input;
    if (path.indexOf("http") === 0) {
        var mm = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = mm ? mm[1] : path;
    }
    // Doi hau to -<N>.html theo so trang (trang 1 -> -0.html).
    var idx = pageNum - 1;
    if (!/-\d+\.html$/.test(path)) return Response.error("Đường dẫn danh sách không hợp lệ: " + input);
    path = path.replace(/-\d+\.html$/, "-" + idx + ".html");

    var url = absUrl(path);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var items = parseNovelItems(rr.doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + url);

    // Con trang sau khong? Tim link phan trang toi chi so ke tiep (idx + 1).
    var next = "";
    var links = rr.doc.select("a[href*=/list/]");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        if (href.indexOf("-" + (idx + 1) + ".html") !== -1) { next = String(pageNum + 1); break; }
    }
    return Response.success(items, next);
}
