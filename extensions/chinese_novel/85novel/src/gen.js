// gen.js — Script list dung chung cho home/genre (execute(query, page)
// -> items, nextToken).
//
// query la input cua tab/the loai (vd. "/list/index", "/list/667/",
// "/top/index"); page la token trang ke (URL tuong doi, vd.
// "/list/page2/") — app truyen lai data2 cua lan goi truoc. Neu page
// trong thi lay trang 1 cua query.
// Phan trang cua site: /list/pageN/, /list/<id>/pageN/, /top/pageN/...
// (nut next a.pagination-btn.rounded-r-lg).
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function execute(query, page) {
    var url = page || query;
    if (!url) return Response.error("Thiếu mục danh sách.");
    url = normalizeInput(url);
    var r = pacedFetch(url, {
        headers: { "Accept-Language": "zh-TW,zh;q=0.9,zh-CN;q=0.8,en;q=0.7" },
        minDelayMs: 30000,
        maxDelayMs: 30500,
        maxRetries: 0
    });
    if (!r.ok) return Response.error(pacedErrorMessage(r));
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e) {
        return Response.error("Không đọc được trang danh sách từ 85 Novel.");
    }
    var data = parseBookList(doc);
    if (!data.length) data = parseHomeBooks(doc);
    if (!data.length) return Response.success([], "");
    var next = nextListToken(doc);
    return Response.success(data, next);
}

// Fallback khi trang khong dung bo cuc list chuan (vd. /top/index):
// lay moi link sach /book/<id>.html kem tieu de, bo trung lap.
function parseHomeBooks(doc) {
    var data = [];
    var seen = {};
    var links = doc.select("a[href^=/book/]");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!/\/book\/\d+\.html$/.test(href || "")) continue;
        var full = absUrl(href);
        if (seen[full]) continue;
        seen[full] = true;
        var title = "";
        var h3El = safeFirst(a.select("h3"));
        if (h3El) title = cleanText(h3El.text());
        if (!title) title = cleanText(a.attr("title"));
        if (!title) title = cleanText(a.text());
        if (!title) continue;
        var coverEl = safeFirst(a.select("img"));
        var cover = coverEl ? absUrl(coverEl.attr("src")) : "";
        if (/nocover\.jpg$/i.test(cover)) cover = "";
        var authorEl = safeFirst(a.select("span.truncate"));
        var author = authorEl ? cleanText(authorEl.text()) : "";
        var descEl = safeFirst(a.select("p.line-clamp-3"));
        var desc = descEl ? cleanText(descEl.text()) : "";
        data.push({
            name: title,
            link: full,
            cover: cover,
            description: desc,
            author: author,
            detail: "",
            host: BASE_URL
        });
    }
    return data;
}
