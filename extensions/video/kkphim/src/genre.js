// genre.js — danh sach the loai tu API /v1/api/the-loai.
// Moi muc tro ve search.js voi input la duong dan danh-sach/hoat-hinh
// loc theo category (kho tong hop, khong loc country).
// Loai "phim-18" (NSFW) bi loai khoi catalog chung (quy tac 6.7).
//
// Tai len: file config.js, file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute() {
    var json = fetchJson(BASE_URL + "/v1/api/the-loai");
    if (!json || !json.data || !json.data.items) return Response.error("Không tải được danh sách thể loại: " + BASE_URL + "/v1/api/the-loai");
    var genres = [];
    var items = json.data.items;
    var i = 0;
    for (i = 0; i < items.length; i++) {
        var slug = items[i].slug;
        var name = items[i].name;
        if (!slug || !name) continue;
        if (slug === "phim-18") continue;
        genres.push({ title: name, input: "/v1/api/danh-sach/hoat-hinh?category=" + slug, script: "search.js" });
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
