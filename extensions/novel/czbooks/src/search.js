// search.js — tim kiem theo tu khoa cua 小說狂人 (czbooks.net).
// URL dang path /s/{tu-khoa} (KHONG phai query string; /search?q=…
// va /s?q=… deu 404). 42 item/trang, phan trang /s/{kw}/{page}.
// Search khop ca ten truyen va ten tac gia.
// QUIRK (khao sat 2026-11-07): search can phon the — tim gian the
// (vd 剑来) cho ket qua thieu/sai, tim phon the (劍來) moi dung.
// Khong lam bang convert gian->phon (qua lon); dung query nguyen van.
// Ket qua: ul.nav.novel-list.style-default > li.novel-item-wrapper
// (xem helper.js parseNovelItem). Phan trang: ul.nav.paginate
// (xem helper.js nextListPath — token tra ve la PATH trang ke).
// Vi du: /s/誰讓他修仙的 -> 42 item, 《誰讓他修仙的！》 tac gia
// 最白的烏鴉, 30426 收藏 / 3564116 观看.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var url = "";
    if (page && page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        url = BASE_URL + page;
    } else {
        var n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        url = BASE_URL + "/s/" + encodeURIComponent(query);
        if (n > 1) url = url + "/" + n;
    }

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    var items = [];
    var seen = {};
    doc.select("ul.nav.novel-list > li.novel-item-wrapper").forEach(function (el) {
        var item = parseNovelItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    return Response.success(items, nextListPath(doc));
}
