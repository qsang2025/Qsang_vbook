// page.js — Phan trang muc luc (execute(url) -> danh sach URL trang TOC).
//
// Bixiange dung kieu DedeCMS: /{cat}/{id}/index_{N}.html. Truyen mau 794
// chuong co toan bo TOC tren 1 trang (khong co link index_N) nen chi tra
// 1 trang. Doc trang chi tiet de tim so trang lon nhat.
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

function execute(url) {
    var storyUrl = resolveUrl(url);
    var storyPath = storyPathFromUrl(storyUrl);
    var r = fetchBxDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var maxPage = 1;
    var pageLinks = r.doc.select("a[href*='" + storyPath + "/index_']");
    for (var i = 0; i < pageLinks.size(); i++) {
        var h = String(pageLinks.get(i).attr("href") || "");
        var m = /\/index_(\d+)\.html/.exec(h);
        if (m) {
            var pn = parseInt(m[1], 10);
            if (!isNaN(pn) && pn > maxPage) maxPage = pn;
        }
    }
    var pages = [storyUrl];
    for (var p = 2; p <= maxPage; p++) {
        pages.push(BASE_URL + storyPath + "/index_" + p + ".html");
    }
    return Response.success(pages);
}
