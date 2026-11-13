// genre.js — Doc the loai live tu trang chu (69 the loai, kiem chung
// 2026-11-13). Bo trung theo href.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var r = fetchTruyenmoPage(BASE_URL);
    if (r.error) return Response.error(r.error);

    var data = [];
    var seen = {};
    var links = r.doc.select('.list-story-categories .show-list-categories a[href*="/the-loai/"], .dropdown-menu a.dropdown-item[href*="/the-loai/"], .list-categories .item-category a[href*="/the-loai/"]');
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = normalizeUrl(a.attr('href'));
        if (!href || seen[href]) continue;
        seen[href] = true;
        var title = cleanText(a.text());
        if (!title) continue;
        data.push({
            title: title,
            input: href,
            script: 'gen.js'
        });
    }

    return Response.success(data);
}
