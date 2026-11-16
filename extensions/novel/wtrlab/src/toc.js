// toc.js — Muc luc qua API (execute(url) -> [{name, url, lock}]).
// GET /api/chapters/<raw_id> tra day du 1 lan goi: {chapters:[{id,
// order, title, name, locked}]} — khong can page.js.
// URL chuong theo dung dang cua site:
// /en/novel/<raw_id>/<slug>/chapter-<order>.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var parsed = parseDetailUrl(url);
    if (!parsed) return Response.error("Không đọc được đường dẫn truyện.");
    var r = fetchToc(parsed.rawId);
    if (r.error) return Response.error(r.error);
    var chs = r.chapters;
    if (chs.length === 0) return Response.error("Truyện chưa có chương nào.");
    var out = [];
    var i = 0;
    for (i = 0; i < chs.length; i++) {
        var c = chs[i];
        var order = c.order;
        if (order === undefined || order === null) order = i + 1;
        var name = htmlDecode(c.title || c.name || "");
        if (!name) name = "Chương " + order;
        out.push({
            name: name,
            url: chapterUrl(parsed.rawId, parsed.slug, order),
            description: "",
            lock: !!c.locked,
            pay: false
        });
    }
    return Response.success(out);
}
