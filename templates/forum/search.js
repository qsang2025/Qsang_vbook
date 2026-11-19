// search.js — danh sach thread (hoac board) + tim kiem tu khoa (template forum).
// Script nay vua la tim kiem, vua la script danh sach cho tab home.js /
// genre.js: query bat dau bang "/" hoac "http" thi coi la duong dan chuyen
// muc, khong phai tu khoa. Thread ghim (pinned) tu xep len dau.
// Bam vao thread thi mo thang reader (posts.js), khong qua trang detail.
//
// Tim kiem tu khoa: doi endpoint theo site that. Nhieu dien dan (vd XenForo)
// khong co tim kiem GET — phai POST (lay token roi gui form); xem
// extensions/forum/otofun de co mau POST chay duoc. Neu site khong co tim
// kiem that thi bo search.js theo pattern aztruyen (chi giu home/genre tro
// ve script danh sach khac) va ghi ro ly do.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";

    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Duyet danh sach: query la duong dan chuyen muc hoac URL day du.
        var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
        url = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    } else {
        // Tu khoa: doi endpoint theo site that.
        url = BASE_URL + "/search?q=" + encodeURIComponent(query) + "&page=" + page;
    }
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var items = doc.select("SELECTOR_THREAD_ITEMS").map(function (el) {
        return {
            name: el.select("SELECTOR_THREAD_TITLE").text(),
            link: el.select("SELECTOR_THREAD_TITLE a").attr("href"),
            author: el.select("SELECTOR_THREAD_AUTHOR").text(),
            avatar: el.select("SELECTOR_THREAD_AVATAR img").attr("src"),
            time: el.select("SELECTOR_THREAD_TIME").text(),
            replies: el.select("SELECTOR_THREAD_REPLIES").text(),
            views: el.select("SELECTOR_THREAD_VIEWS").text(),
            board: el.select("SELECTOR_THREAD_BOARD").text(),
            pinned: !el.select("SELECTOR_THREAD_PINNED").isEmpty(),
            locked: !el.select("SELECTOR_THREAD_LOCKED").isEmpty()
        };
    });

    var hasNext = !doc.select("SELECTOR_NEXT_PAGE").isEmpty();
    return Response.success(items, hasNext ? (parseInt(page) + 1).toString() : "");
}
