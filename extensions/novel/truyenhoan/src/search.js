// search.js — Tim kiem truyen tren Truyen Hoan
load('config.js');

function normalizeLink(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function pickCover(row) {
    var lazy = row.select('div.lazyimg').first();
    if (lazy) {
        var u = lazy.attr('data-desk-image') || lazy.attr('data-image');
        if (u) {
            if (u.indexOf('//') === 0) u = 'https:' + u;
            if (u.indexOf('_cover_list') >= 0) u = u.replace('_cover_list', '_cover_large');
            return u;
        }
    }
    var img = row.select('img').first();
    if (img) {
        var s = img.attr('data-src') || img.attr('src') || '';
        if (s.indexOf('//') === 0) return 'https:' + s;
        return s;
    }
    return '';
}

function findNextPage(doc) {
    var lis = doc.select('ul.pagination > li');
    var idx = -1;
    for (var i = 0; i < lis.size(); i++) {
        var cls = lis.get(i).attr('class') || '';
        if (cls.indexOf('active') >= 0) {
            idx = i;
            break;
        }
    }
    if (idx < 0) return null;
    for (var j = idx + 1; j < lis.size(); j++) {
        var a = lis.get(j).select("a[href*='trang-']").first();
        if (a) {
            var href = a.attr('href') || '';
            var m = href.match(/trang-(\d+)\//);
            if (m) return m[1];
        }
    }
    return null;
}

function parseRows(doc) {
    var rows = doc.select('#list-page .list.list-truyen .row[itemscope]');
    if (rows.size() === 0) {
        rows = doc.select('#list-page .list-truyen .row[itemscope]');
    }
    if (rows.size() === 0) {
        rows = doc.select('#list-page div.row[itemscope]');
    }
    if (rows.size() === 0) {
        rows = doc.select('.list.list-truyen .row[itemscope]');
    }
    var novels = [];
    rows.forEach(function(row) {
        var titleA = row.select('h3.truyen-title a').first();
        if (!titleA) return;

        var name = titleA.text().trim();
        var href = normalizeLink(titleA.attr('href'));
        if (!name || !href) return;

        var authorName = '';
        var chapterInfo = '';
        row.select('span.author').forEach(function(sp) {
            var t = sp.text().trim().replace(/\s+/g, ' ');
            if (sp.attr('itemprop') === 'author') {
                authorName = t;
            } else if (sp.select('.glyphicon-list').size() > 0) {
                chapterInfo = t;
            }
        });

        var badges = [];
        if (row.select('.label-full').size() > 0) badges.push('Full');
        if (row.select('.label-hot').size() > 0) badges.push('Hot');
        if (row.select('.label-new').size() > 0) badges.push('New');

        var parts = [];
        if (authorName) parts.push(authorName);
        if (chapterInfo) parts.push(chapterInfo);
        if (badges.length > 0) parts.push(badges.join(', '));

        novels.push({
            name: name,
            link: href,
            cover: pickCover(row),
            description: parts.join(' - '),
            host: BASE_URL
        });
    });
    return novels;
}

function execute(query, page) {
    page = page !== undefined && page !== null ? String(page) : '1';
    if (!query || !String(query).trim()) {
        return Response.error('Nhập từ khóa tìm kiếm.');
    }

    var q = String(query).trim();
    var path = '/tim-kiem/?tukhoa=' + encodeURIComponent(q);
    if (page !== '1') {
        path = '/tim-kiem/trang-' + page + '/?tukhoa=' + encodeURIComponent(q);
    }
    var url = BASE_URL + path;

    var response = fetch(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();

    var novels = parseRows(doc);
    if (novels.length === 0) {
        return Response.error('Không tìm thấy truyện phù hợp.');
    }

    var nextPage = findNextPage(doc);
    return Response.success(novels, nextPage);
}
