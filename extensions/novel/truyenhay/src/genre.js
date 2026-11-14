// genre.js — Danh sach chuyen muc Truyen Hay (truyenhay.com).
//
// Doc live tu WP REST API /categories. Bo chuyen muc rong, "Uncategorized"
// va "Chua duoc phan loai" (khong phai the loai that).
// Input tra ve la id so (dang chuoi); gen.js nhan ca id va slug.
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute() {
    rateLimitDelay("truyenhay.com");
    var response = fetch(API_URL + "/categories", {
        queries: { per_page: "100", _fields: "id,name,slug,count" }
    });
    if (!response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + response.status + ")");
    var genres = [];
    var list = response.json() || [];
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var e = list[i];
        if (!e.count || e.slug === "uncategorized" || e.slug === "chua-duoc-phan-loai") continue;
        genres.push({ title: decodeHtml(e.name), input: String(e.id), script: "gen.js" });
    }
    if (genres.length === 0) return Response.error("Không tìm thấy thể loại nào");
    return Response.success(genres);
}
