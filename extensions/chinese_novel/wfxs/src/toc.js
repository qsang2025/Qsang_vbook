// toc.js — muc luc chuong (wfxs.tw).
// Nhan URL trang chi tiet /xiaoshuo/<id>/ (hoac truc tiep
// /booklist/<id>.html), chuyen sang trang muc luc /booklist/<id>.html
// — muc luc day du tren 1 trang (kiem chung: 1.824 chuong, 270 KB,
// khong phan trang). Neu site them phan trang (.pages), duyet tiep toi
// da 10 trang. Chuong trung ten la hop le (nhieu 第2章 khac ID/ngay),
// chi loai trung theo URL.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/xiaoshuo\/(\d+)\/?/);
    var tocUrl = url;
    if (m) tocUrl = BASE_URL + "/booklist/" + m[1] + ".html";

    var chapters = [];
    var seen = {};
    var currentUrl = tocUrl;
    var pageCount = 0;
    while (currentUrl && pageCount < 10) {
        pageCount++;
        var doc = fetchDocPaced(currentUrl);
        if (!doc) return Response.error("Không tải được mục lục (" + lastFetchError + "): " + currentUrl);

        var links = doc.select("#readerlists ul li a");
        var i = 0;
        for (i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var name = cleanText(a.text());
            var href = absUrl(a.attr("href"));
            if (!name || !href) continue;
            if (seen[href]) continue;
            seen[href] = true;
            chapters.push({ name: name, url: href, host: siteOrigin() });
        }

        // Muc luc hien tai khong phan trang; chi duyet tiep neu site them .pages.
        var nextUrl = "";
        var pagesEl = safeFirst(doc.select(".pages"));
        if (pagesEl) {
            var pageLinks = pagesEl.select("a");
            var j = 0;
            for (j = 0; j < pageLinks.size(); j++) {
                var pa = pageLinks.get(j);
                var pText = cleanText(pa.text());
                if (pText === "下一頁" || pText === "下一页") {
                    nextUrl = absUrl(pa.attr("href"));
                    break;
                }
            }
        }
        currentUrl = nextUrl;
    }

    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục truyện: " + url);
    }
    return Response.success(chapters);
}
