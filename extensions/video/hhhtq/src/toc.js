// toc.js — muc luc cac tap cua mot phim tren hhhtq.team (/phim/<id>/).
// Moi tap tra ve 1 muc duy nhat theo thu tu tang dan (Tap 1 -> Tap N);
// viec chon Server 1..4 do chap.js dam nhiem theo dung hop dong video.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    url = toDetailUrl(normalizeUrl(url));
    rateLimitDelay(siteOrigin(), 400, 1000);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục tập: " + url);

    var epMap = {};
    var epNums = [];
    var links = doc.select("#playlist1 a[href*='/xem/'], #glist-1 a[href*='/xem/'], a[href*='/xem/']");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        var m = href.match(/\/xem\/(\d+)-sv(\d+)-ep(\d+)\/?/i);
        if (!m) continue;
        var epNum = parseInt(m[3], 10);
        if (isNaN(epNum) || epNum <= 0) continue;
        if (!epMap[epNum]) {
            var rawText = cleanText(a.text());
            var epName = "Tập " + epNum;
            if (rawText && !/^\d+$/.test(rawText) && rawText.toLowerCase().indexOf("xem phim") === -1) {
                epName = rawText;
            }
            epMap[epNum] = {
                num: epNum,
                name: epName,
                url: absUrl(href)
            };
            epNums.push(epNum);
        }
    }

    epNums.sort(function (a, b) { return a - b; });
    var chapters = [];
    for (i = 0; i < epNums.length; i++) {
        var ep = epMap[epNums[i]];
        chapters.push({
            name: ep.name,
            url: ep.url,
            description: "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy tập phim nào trên trang: " + url);
    }
    return Response.success(chapters);
}
