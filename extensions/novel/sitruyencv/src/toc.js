// toc.js — Muc luc 1 trang (100 chuong) qua API.
// URL trang muc luc do page.js liet ke: /story/<id>?toc_page=<n>&v=<vId>.
// Neu goi truc tiep bang URL chi tiet (khong co toc_page/v) thi mac dinh
// lay trang 1 va tu giai quyet versionId.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var id = storyIdFromUrl(url);
    if (!id) return Response.error("Link truyện không hợp lệ");
    var u = String(url || "");
    var vm = u.match(/[?&]v=(\d+)/);
    var pm = u.match(/[?&]toc_page=(\d+)/);
    var page = pm ? parseInt(pm[1], 10) : 1;
    if (isNaN(page) || page < 1) page = 1;

    var versionId = 0;
    if (vm) {
        versionId = parseInt(vm[1], 10);
    } else {
        var rv = resolveVersionId(id);
        if (rv.error) return Response.error(rv.error);
        versionId = rv.versionId;
    }

    var api = API_URL + "/api/chapters/" + versionId + "?page=" + page + "&limit=100&story_id=" + id + "&sort_order=asc";
    var rr = stvFetchJson(api);
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.data || !json.data.items) {
        return Response.error("Không đọc được mục lục");
    }
    var list = json.data.items;
    if (!list.length) return Response.error("Truyện chưa có chương nào");

    var chapters = [];
    for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c) continue;
        var num = c.chapter_number != null ? c.chapter_number : (chapters.length + 1);
        var rawTitle = c.title ? String(c.title) : "";
        var title = rawTitle;
        if (!title) {
            title = "Chương " + num;
        } else if (title.toLowerCase().indexOf("chương") < 0 && title.toLowerCase().indexOf("chuong") < 0) {
            title = "Chương " + num + ": " + title;
        }
        var paid = c.is_paid === true;
        chapters.push({
            name: title,
            url: BASE_URL + "/read/" + id + "/" + num + "?v=" + versionId,
            host: BASE_URL,
            lock: paid,
            pay: paid
        });
    }
    return Response.success(chapters);
}
