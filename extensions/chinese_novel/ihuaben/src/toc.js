// toc.js — Muc luc day du trong 1 lan goi.
// GET /list/<id>.html?sortType=0&pageSize=99999 tra toan bo chuong
// (tham so pageSize bi site bo qua); khong can page.js.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var m = /\/book\/(\d+)\.html/.exec(storyUrl);
    if (!m) return Response.error("URL truyện không hợp lệ: " + storyUrl);
    var listUrl = BASE_URL + "/list/" + m[1] + ".html?sortType=0&pageSize=99999";
    var rr = ttlFetchDoc(listUrl, storyUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var list = [];
    var links = doc.select(".chapter-row a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = cleanText(a.text());
        var href = normalizeUrl(a.attr("href") || "");
        if (href && name) {
            list.push({ name: name, url: href, host: BASE_URL });
        }
    }
    if (list.length === 0) return Response.error("Không đọc được mục lục (site trả về rỗng): " + storyUrl);
    return Response.success(list);
}
