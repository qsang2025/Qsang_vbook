// genre.js — danh sach the loai doc live tu /vi/genres.
//
// Moi the loai: link a[href="/vi/genres/<slug>"], ten kem so luong
// ("Co dai 193 truyen") — cat duoi "N truyen" truoc khi tra ve.
// Tab tro ve gen.js voi input la URL day du /vi/genres/<slug>.
//
// Tai len: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var target = BASE_URL + "/vi/genres";
    var r = fetchStoryaDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select('a[href*="/vi/genres/"]');
    var out = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = String(link.attr("href") || "");
        var match = /^\/vi\/genres\/([^\/\?#]+)$/.exec(href);
        if (!match || seen[match[1]]) continue;
        seen[match[1]] = true;
        var title = cleanText(link.text()).replace(/\d[\d.,]*\s*(truyện|stories)$/i, "").trim();
        if (!title) continue;
        out.push({ title: title, input: BASE_URL + "/vi/genres/" + match[1], script: "gen.js" });
    }
    if (out.length === 0) return Response.error("Không đọc được danh sách thể loại từ " + target);
    return Response.success(out);
}
