// page.js — Tinh so trang cua muc luc chuong Truyen Hoan
load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    if (url.indexOf('/trang-') >= 0) {
        url = url.replace(/\/trang-\d+\/?(?:#.*)?$/, '/');
    }

    var response = fetch(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();

    var pageCount = 1;
    doc.select('#list-chapter ul.pagination a').forEach(function(a) {
        var link = a.attr('href') || '';
        var match = link.match(/trang-(\d+)/i);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num > pageCount) pageCount = num;
        }
    });

    var base = url;
    if (base.charAt(base.length - 1) !== '/') base = base + '/';

    var pages = [];
    for (var i = 1; i <= pageCount; i++) {
        var pageUrl = base;
        if (i > 1) {
            pageUrl = base + 'trang-' + i + '/';
        }
        pages.push(pageUrl);
    }

    return Response.success(pages);
}
