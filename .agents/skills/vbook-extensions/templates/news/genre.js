// genre.js — danh sach chuyen muc (template news).
// Input la duong dan chuyen muc, search.js se tai danh sach bai.
// Neu site co trang danh sach chuyen muc thi fetch o day; khong thi
// tra danh sach tinh theo menu chinh cua site.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute() {
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(BASE_URL + "/SELECTOR_GENRE_PATH");
    if (!doc) return Response.error("Không tải được danh sách chuyên mục");

    var genres = [];
    doc.select("SELECTOR_GENRE_LIST a").forEach(function (el) {
        var href = String(el.attr("href") || "");
        if (!href) return;
        genres.push({
            title: cleanText(el.text()),
            input: href,
            script: "search.js"
        });
    });
    return Response.success(genres);
}
