// toc.js — Danh sach chuong Truyen Hoan
load('config.js');

function normalizeTocPageUrl(u) {
    u = u.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (u.indexOf('//') === 0) u = 'https:' + u;
    u = u.replace(/#.*$/, '');
    if (u.charAt(u.length - 1) !== '/') u = u + '/';
    return u;
}

function normalizeChapterHref(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function chapterDedupeKey(href) {
    var h = normalizeChapterHref(href);
    if (h.charAt(h.length - 1) === '/') h = h.slice(0, -1);
    return h;
}

function execute(url) {
    var pageUrl = normalizeTocPageUrl(url);

    var response = fetch(pageUrl);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();

    var chapters = [];
    var seen = {};

    var links = doc.select('#list-chapter ul.list-chapter li a');
    if (links.size() === 0) {
        links = doc.select('ul.l-chapters li a');
    }
    if (links.size() === 0) {
        links = doc.select("ul.list-chapter li a, a[href*='/chuong-']");
    }

    links.forEach(function(a) {
        var raw = a.attr('href') || '';
        var chapterLink = normalizeChapterHref(raw);
        var chapterTitle = a.text().trim();
        var key = chapterDedupeKey(raw);
        if (chapterLink && chapterTitle.length > 0 && !seen[key]) {
            seen[key] = true;
            chapters.push({
                name: chapterTitle,
                url: chapterLink,
                host: BASE_URL
            });
        }
    });

    if (chapters.length === 0) {
        return Response.error('Không tìm thấy chương trong Danh sách chương.');
    }

    return Response.success(chapters);
}
