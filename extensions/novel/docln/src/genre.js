// genre.js — danh sach the loai (doc live tu bo loc cua /danh-sach).
//
// Trang chu khong co menu the loai; bo loc day du (60 the loai) nam tren
// moi trang /danh-sach (link a[href*="/the-loai/"]). Doc live de danh sach
// luon khop site (site them the loai moi thi tu co, khong can sua code).
// Moi muc tro ve gen.js voi input la URL /the-loai/<slug>.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var r = fetchDoclnDoc(BASE_URL + "/danh-sach");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var data = [];
    var seen = {};
    var sel = doc.select("a[href*=\"/the-loai/\"]");
    for (var i = 0; i < sel.size(); i++) {
        var a = sel.get(i);
        var href = String(a.attr("href") || "");
        var title = cleanText(a.text());
        if (!href || !title) continue;
        var link = toSiteUrl(href);
        if (seen[link]) continue;
        seen[link] = 1;
        data.push({ title: title, input: link, script: "gen.js" });
    }
    if (data.length === 0) return Response.error("Không đọc được danh sách thể loại.");
    return Response.success(data);
}
