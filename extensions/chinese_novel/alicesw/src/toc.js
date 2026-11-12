// toc.js — muc luc truyen alicesw.
// Input la URL chi tiet /novel/<id>.html; doi sang endpoint muc luc
// /other/chapters/id/<id>.html (toan bo chuong trong 1 trang — da kiem
// chung truyen 477 chuong van chi co 1 trang, khong phan trang nen khong
// can page.js). Link chuong co dang /book/<id-noi-bo>/<hash>.html.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = toWww(url);
    var tocUrl = url.replace("/novel/", "/other/chapters/id/");
    var response = fetchPage(tocUrl);
    if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
    var doc = response.html();
    var data = [];
    var seen = {};
    var els = doc.select(".section-list li a");
    for (var i = 0; i < els.size(); i++) {
        var e = els.get(i);
        var chapterName = e.text();
        // Site doi khi liet ke trung 1 chuong voi 2 URL khac nhau
        // (vd. chuong 309 cua truyen 44787 co 2 hash) — giu lai ban
        // dau tien de so chuong khop voi so chuong that cua truyen.
        if (seen[chapterName]) continue;
        seen[chapterName] = true;
        data.push({
            name: chapterName,
            url: BASE_URL + e.attr("href"),
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không thấy chương nào trong mục lục");
    return Response.success(data);
}
