// toc.js — Muc luc: day du ngay tren trang chi tiet (#listChapters),
// sap xep tang dan theo so chuong (trang chi tiet liet ke moi nhat truoc).
// Khong can page.js (ke ca truyen 1.353 chuong cung nam gon trong 1 trang).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTruyenmoPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var chapters = [];
    var seen = {};

    var items = doc.select('#listChapters .list-chapters .item .episode-title a, #listChapters .episode-title a, #listChapters a[href*=".html"]');
    if (!items || items.size() === 0) {
        items = doc.select('select#chapterSelect option[value], .chapter-select option[value]');
    }

    items.forEach(function(a) {
        var href = normalizeUrl(a.attr('href') || buildChapterFromOption(a.attr('value')));
        if (!href || seen[href]) return;
        seen[href] = true;

        var title = cleanText(a.text());
        if (!title) title = guessChapterName(href);

        chapters.push({
            name: title,
            url: href,
            host: BASE_URL
        });
    });

    chapters.sort(function(a, b) {
        var na = chapterNumber(a);
        var nb = chapterNumber(b);
        if (na !== -1 && nb !== -1 && na !== nb) return na - nb;
        if (na !== -1 && nb === -1) return -1;
        if (na === -1 && nb !== -1) return 1;
        return a.name.localeCompare(b.name);
    });

    return Response.success(chapters);
}

function buildChapterFromOption(raw) {
    var v = cleanText(raw);
    if (!v) return '';
    if (v.indexOf('http://') === 0 || v.indexOf('https://') === 0) return v;
    if (v.indexOf(',') >= 0) {
        var parts = v.split(',');
        if (parts.length >= 2) return '/' + parts[0] + '/' + parts[1] + '.html';
    }
    return v;
}

function guessChapterName(url) {
    var m = String(url || '').match(/\/([^\/]+)\.html/i);
    if (!m) return 'Chương';
    return cleanText(m[1].replace(/[-_]+/g, ' '));
}

function chapterNumber(item) {
    var text = (item.name || '') + ' ' + (item.url || '');
    var m = text.match(/chuong[-\s]*(\d+)/i);
    if (!m) m = text.match(/\/(\d+)\.html/i);
    if (!m) return -1;
    return parseInt(m[1], 10);
}
