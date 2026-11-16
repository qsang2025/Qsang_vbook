// genre.js — lay 8 the loai tu trang chu (.sort ul li a[href]).
// Kiem chung live 2026-11-16: /wapsort/1_1.html .. /wapsort/8_1.html.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute() {
    var r = fetchPoDoc(BASE_URL);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var genres = [];
    var links = doc.select(".sort ul li a[href]");
    for (var i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var title = cleanText(el.text());
        var href = absUrl(el.attr("href"));
        if (!title || !href) continue;
        genres.push({ title: title, input: href, script: "search.js" });
    }

    return Response.success(genres);
}
