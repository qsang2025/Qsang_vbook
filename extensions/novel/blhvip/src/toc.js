// toc.js — Danh sach chuong cua MOT trang muc luc (50 chuong).
// URL vao la URL chi tiet (mac dinh trang 1) hoac mot URL API trang
// muc luc do page.js tra. Chuong VIP (is_vip) danh dau pay, khong mo khoa.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var apiUrl = "";
    var m = /\/v1\/story\/.+$/.exec(String(url || ""));
    if (m) {
        apiUrl = API_URL + m[0];
    } else {
        var slug = storySlug(url);
        if (!slug) return Response.error("URL truyện không hợp lệ");
        apiUrl = API_URL + "/v1/story/" + slug + "/chapter_list?new=0&page=1";
    }

    var rr = blhFetchJson(apiUrl);
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.success) return Response.error("Không tải được danh sách chương");

    var chapters = [];
    var data = json.data || [];
    for (var i = 0; i < data.length; i++) {
        var e = data[i];
        var cname = e.name ? String(e.name) : "";
        var curl = e.url ? String(e.url) : "";
        if (!cname || !curl) continue;
        var vip = e.is_vip ? true : false;
        chapters.push({
            name: cname,
            url: normalizeUrl(curl),
            lock: vip,
            pay: vip
        });
    }
    if (chapters.length === 0) return Response.error("Truyện này hiện chưa có chương nào");
    return Response.success(chapters);
}
