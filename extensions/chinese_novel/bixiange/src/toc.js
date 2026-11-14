// toc.js — Muc luc 1 trang (execute(url) -> danh sach chuong).
//
// Link chuong nam trong div.catalog: /{cat}/{id}/index/{n}.html, ten
// "第N节". Link "在线阅读" tro ve chuong 1 cung URL nen bi bo qua theo
// ten (chuong 1 van co mat nho link "第1节"). Sap xep theo so chuong.
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
    var pageUrl = resolveUrl(url);
    var storyPath = storyPathFromUrl(pageUrl);
    var r = fetchBxDoc(pageUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var chapters = [];
    var seen = {};
    var links = doc.select(".catalog a[href*='" + storyPath + "/']");
    if (links.size() === 0) links = doc.select("a[href*='" + storyPath + "/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var info = getChapterHrefInfo(a.attr("href") || "", storyPath);
        if (!info || info.part !== 1) continue;
        var href = resolveUrl(info.path);
        if (seen[href]) continue;
        var chapName = cleanText(a.text());
        if (!chapName) chapName = cleanText(a.attr("title"));
        if (!chapName || LIST_SKIP_NAME_RE.test(chapName)) continue;
        if (chapName.length < 2) continue;
        seen[href] = 1;
        chapters.push({ number: info.number, name: chapName, url: href });
    }
    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương.");
    chapters.sort(function (a, b) { return a.number - b.number; });
    var result = [];
    for (var j = 0; j < chapters.length; j++) {
        result.push({ name: chapters[j].name, url: chapters[j].url, host: BASE_URL });
    }
    return Response.success(result);
}
