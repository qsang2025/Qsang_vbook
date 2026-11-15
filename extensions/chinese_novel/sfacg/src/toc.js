// toc.js — Muc luc (execute(url) -> danh sach chuong).
//
// Muc luc nam o <detail>/MainIndex/ tren 1 trang (kiem chung live
// 2026-11-16, sach mau 64 muc: 44 chuong mien phi + 20 chuong VIP):
// .story-catalog > .catalog-title (ten tap, tra ve muc section) +
// .catalog-list ul li a (chuong). Chuong VIP co href /vip/c/<id>/ hoac
// icon .icn_vip trong link -> lock: true, pay: true, ten co tien to
// "[VIP] ". Fallback: ul.mulu_list a (bo cuc mobile).
// Ten chuong lay tu attr title truoc, neu khong co thi lay text (bo
// chu "VIP" va ky tu icon).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeSfUrl(url);
    if (!url) return Response.error("Đường dẫn truyện trống.");
    if (url.charAt(url.length - 1) !== "/") url = url + "/";
    var tocUrl = url + "MainIndex/";

    var r = fetchSfDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var data = [];
    var seen = {};

    function pushChapter(a) {
        var href = a.attr("href");
        if (!href) return;
        var link = absUrl(href);
        if (!link || seen[link]) return;
        var title = a.attr("title");
        if (!title) {
            title = cleanText(a.text()).replace(/VIP/g, "").replace(//g, "").trim();
        }
        if (!title) return;
        var isVip = href.indexOf("/vip/") !== -1 || a.select(".icn_vip").size() > 0;
        if (isVip && title.indexOf("[VIP]") !== 0) title = "[VIP] " + title;
        seen[link] = true;
        data.push({
            name: title,
            url: link,
            host: siteOrigin(),
            lock: isVip,
            pay: isVip,
            type: "chapter"
        });
    }

    var catalogs = doc.select(".story-catalog");
    if (catalogs.size() > 0) {
        for (var i = 0; i < catalogs.size(); i++) {
            var cat = catalogs.get(i);
            var volTitle = cleanText(cat.select(".catalog-title").text());
            if (volTitle) {
                data.push({ name: volTitle, type: "section" });
            }
            var chList = cat.select(".catalog-list ul li a");
            for (var j = 0; j < chList.size(); j++) {
                pushChapter(chList.get(j));
            }
        }
    } else {
        var flatList = doc.select(".catalog-list ul li a");
        if (flatList.size() === 0) flatList = doc.select("ul.mulu_list a");
        for (var k = 0; k < flatList.size(); k++) {
            pushChapter(flatList.get(k));
        }
    }

    if (data.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện).");
    }
    return Response.success(data);
}
