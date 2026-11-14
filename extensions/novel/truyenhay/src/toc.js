// toc.js — Muc luc truyen Truyen Hay (truyenhay.com).
//
// Lay bai viet theo slug qua API de biet ten series, roi tim tat ca ky
// cua series do qua API search (sap xep theo ngay tang dan), loc dung
// ten series, sap theo so ky. Truyen le (1 bai) thi muc luc chi co 1 muc.
// Khong can page.js: toc.js tu lap cac trang API (toi da 30 trang).
// execute(url).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var slug = postSlug(url);
    if (!slug) return Response.error("URL truyện không hợp lệ");

    var response = fetchPosts({ slug: slug, _fields: "id,link,title,date" });
    if (!response.ok) return Response.error("Không tải được truyện (HTTP " + response.status + ")");
    var found = response.json();
    if (!found || !found.length) return Response.error("Không tìm thấy bài viết");
    var current = found[0];
    var info = parseTitle(current.title.rendered);
    var key = seriesKey(info.series);

    var posts = [];
    var hasCurrent = false;
    var page = 1;
    var total = 1;
    do {
        var list = fetchPosts({
            search: info.series,
            search_columns: "post_title",
            orderby: "date",
            order: "asc",
            per_page: "100",
            page: String(page),
            _fields: "id,link,title"
        });
        if (!list.ok) break;
        total = parseInt(list.header("x-wp-totalpages"), 10) || 1;
        var arr = list.json() || [];
        var i = 0;
        for (i = 0; i < arr.length; i++) {
            var item = parseTitle(arr[i].title.rendered);
            if (seriesKey(item.series) !== key) continue;
            if (arr[i].id === current.id) hasCurrent = true;
            posts.push({ info: item, link: arr[i].link, index: posts.length });
        }
        page++;
    } while (page <= total && page <= 30);

    if (!hasCurrent) {
        posts.push({ info: info, link: current.link, index: posts.length });
    }
    posts.sort(function (a, b) {
        return a.info.number - b.info.number || a.index - b.index;
    });

    var chapters = [];
    var k = 0;
    for (k = 0; k < posts.length; k++) {
        chapters.push({
            name: chapterName(posts[k].info),
            url: posts[k].link,
            lock: false,
            pay: false
        });
    }
    return Response.success(chapters);
}
