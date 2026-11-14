// page.js — Phan trang muc luc.
//
// Input: URL chi tiet truyen (/novel/<slug>.html, co the kem ?tab=chapters).
// Fetch /e/extend/fy.php?page=0&wjm=<slug>, doc link ">>" trong phan trang
// de tinh trang cuoi, tra ve danh sach URL tuyet doi cac trang muc luc
// (100 chuong/trang). Truyen < 100 chuong chi co 1 trang.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/novel\/([^\/\?#]+)\.html/);
    if (!m) return Response.error("URL truyện không hợp lệ: " + url);
    var slug = m[1].replace(/_\d+$/, "");

    var first = BASE_URL + "/e/extend/fy.php?page=0&wjm=" + slug;
    var rr = ttlFetchDoc(first);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var lastPage = 0;
    var links = doc.select("ul.pagination a[href*=fy.php?page=]");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var pm = href.match(/page=(\d+)/);
        if (pm) {
            var p = parseInt(pm[1], 10);
            if (!isNaN(p) && p > lastPage) lastPage = p;
        }
    }
    var pages = [];
    for (var j = 0; j <= lastPage; j++) {
        pages.push(BASE_URL + "/e/extend/fy.php?page=" + j + "&wjm=" + slug);
    }
    return Response.success(pages);
}
