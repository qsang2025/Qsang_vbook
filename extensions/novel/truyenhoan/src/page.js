// page.js — Tinh so trang cua muc luc chuong Truyen Hoan
// KHONG doi host cua link goc (xem config.js).
load('config.js');

function execute(url) {
    var base = normalizeSiteUrl(url);
    if (!base) {
        return Response.error("Link truyện không thuộc truyenhoan.com hay wetruyen.com. Mã truyện khác nhau giữa các mirror nên không đọc chéo mirror được.");
    }
    if (base.charAt(base.length - 1) !== "/") base = base + "/";
    if (base.indexOf("/trang-") >= 0) {
        base = base.replace(/\/trang-\d+\/?(?:#.*)?$/, "/");
    }

    var response = safeFetch(base);
    if (!response) return Response.error("Không kết nối được tới trang truyện.");
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var pageCount = 1;
    doc.select("#list-chapter ul.pagination a").forEach(function(a) {
        var link = a.attr("href") || "";
        var match = link.match(/trang-(\d+)/i);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num > pageCount) pageCount = num;
        }
    });

    if (base.charAt(base.length - 1) !== "/") base = base + "/";

    var pages = [];
    for (var i = 1; i <= pageCount; i++) {
        var pageUrl = base;
        if (i > 1) {
            pageUrl = base + "trang-" + i + "/";
        }
        pages.push(pageUrl);
    }

    return Response.success(pages);
}
