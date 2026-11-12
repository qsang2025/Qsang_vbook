// cat.js — danh sach truyen cua mot the loai (trang /all/book/).
// Input la "class_sub" (vd. "2_21"); URL that:
// /all/book/<input>_0_0_0_0_0_1_<page>.html — 30 truyen/trang.
// Item: .search-list .alltextlist — ten o .alltextmiddle dt a,
// link + bia o .alltextleft a/img, tac gia o .ls a.
// Phan trang: pager .page co link den trang ke tiep thi moi co trang sau.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(input, page) {
    if (!page) page = "1";
    var url = BASE_URL + "/all/book/" + input + "_0_0_0_0_0_1_" + page + ".html";
    var response = fetchPage(url);
    if (!response || !response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + (response ? response.status : 0) + ")");
    var doc = response.html();
    var data = [];
    var items = doc.select(".search-list .alltextlist");
    for (var i = 0; i < items.size(); i++) {
        var e = items.get(i);
        var linkEl = safeFirst(e.select(".alltextleft > a"));
        var nameEl = safeFirst(e.select(".alltextmiddle > dl > dt > a"));
        if (!linkEl || !nameEl) continue;
        var coverEl = safeFirst(e.select(".alltextleft img"));
        var authorEl = safeFirst(e.select(".ls > a"));
        data.push({
            name: cleanText(nameEl.text()),
            link: resolveUrl(linkEl.attr("href")),
            cover: coverEl ? coverEl.attr("src") : "",
            description: authorEl ? cleanText(authorEl.text()) : "",
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không thấy truyện nào trong thể loại này");
    var next = "";
    var cur = parseInt(page, 10);
    var links = doc.select(".page a");
    for (var j = 0; j < links.size(); j++) {
        var href = links.get(j).attr("href") || "";
        var m = href.match(/_(\d+)\.html$/);
        if (m && parseInt(m[1], 10) > cur) {
            next = (cur + 1).toString();
            break;
        }
    }
    return Response.success(data, next);
}
