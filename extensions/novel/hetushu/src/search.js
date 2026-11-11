// search.js — tim kiem theo tu khoa cua 和图书 (hetushu.com).
// GET /search/?keyword=<tu-khoa-url-encoded>. Ket qua: dl.list#body >
// dd (cung cau truc item nhu bang xep hang — xem helper.js parseDdItem),
// 16 truyen/trang, phan trang ?keyword=<kw>&page=N (vd. "重生" co 853
// ket qua / 54 trang, khao sat 2026-11-11). Token trang ke la so trang
// ("2", "3", ...); chi tra token khi div.page co link toi trang ke.
//
// LUU Y: site tra HTTP 302 ve trang chu (/) khi khong tim thay truyen
// nao; fetch cua runtime di theo redirect nen body luc do la trang chu
// (title "和图书") — truong hop nay tra danh sach rong, khong phai loi.
// (Cung co the gap 302 thoang qua o request dau tien tu IP moi; neu tim
// tu khoa co that ma ra rong thi thu lai.)
// Khong thay Cloudflare tren hetushu.com (khao sat 2026-11-10, ca VM
// lan may that).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var n = 1;
    n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var url = BASE_URL + "/search/?keyword=" + encodeURIComponent(query);
    if (n > 1) url = url + "&page=" + n;

    rateLimitDelay("www.hetushu.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    // Redirect ve trang chu (khong co ket qua): title trang chu la
    // "和图书", trang ket qua that la "搜索结果_和图书".
    var title = cleanText(doc.select("title").text());
    if (title === "和图书") {
        return Response.success([], "");
    }

    var items = [];
    var seen = {};
    doc.select("dl#body > dd").forEach(function (el) {
        var item = parseDdItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    // Phan trang: token khi div.page co link toi trang n+1.
    var next = "";
    var hasNext = false;
    doc.select("div.page a").forEach(function (a) {
        var href = a.attr("href") || "";
        if (href.indexOf("page=" + (n + 1)) !== -1) hasNext = true;
    });
    if (hasNext) next = String(n + 1);

    return Response.success(items, next);
}
