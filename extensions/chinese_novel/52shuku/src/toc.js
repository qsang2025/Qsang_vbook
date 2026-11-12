// toc.js — Muc luc 52书库 (52shuku.net).
//
// Muc luc nam ngay tren trang chi tiet: ul.list.clearfix li.mulu a,
// TAT CA tren 1 trang (vd 裂天空骑: 1.347 muc; 邪命疯鬼: 269 muc) nen
// khong can page.js. Ten muc la "第N页" — site phan trang TOAN BO VAN BAN
// truyen chu khong phan theo chuong: trang chi tiet la trang 1 (chi co
// teaser), _2.html la trang 2 (chua TRON ch.1 + dau ch.2), ...
// execute(url) — url la URL trang chi tiet.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");

    var r = fetch52Doc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select(".article-content ul.list.clearfix li.mulu a");
    if (links.size() === 0) {
        links = doc.select("ul.list.clearfix li.mulu a");
    }
    if (links.size() === 0) {
        return Response.error("Không tìm thấy mục lục truyện.");
    }

    var data = [];
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = absUrl(a.attr("href"));
        var name = cleanText(a.text());
        if (!href || !name) continue;
        data.push({
            name: name,
            url: href,
            host: siteOrigin()
        });
    }
    if (data.length === 0) {
        return Response.error("Không tìm thấy mục lục truyện.");
    }
    return Response.success(data);
}
