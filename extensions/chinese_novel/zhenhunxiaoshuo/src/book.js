// book.js — danh sach truyen theo chuyen muc (execute(url, page) -> items, "").
//
// Hai dang bang truyen tren zhenhunxiaoshuo.com (deu 1 trang, khong phan
// trang trong trang; chuyen muc nhieu trang thi tach san thanh /chunai/,
// /chunai2/... o nav):
//   Dang A (/chunai/, /chunai2/, /yanqing/): moi <tr> co 2 <td>:
//     <td><a href="/<slug>/"><strong>Ten truyen</strong></a></td>
//     <td>Tac gia</td>
//   Dang B (/yanqing2/, /baihexiaoshuo/): moi <tr> co 3 <td>, moi <td>:
//     <td><a href="/<slug>/">Ten truyen</a></td>   (khong co cot tac gia)
//   Ca hai dang deu nam trong article.article-content > table.
// Dac biet: bang the loai link truyen 镇魂 ve "/" (trang chu site, khong co
// muc luc) -> doi thanh /lunhuigui/ (trang muc luc that cua 镇魂).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url, page) {
    var target = normalizeUrl(url);
    rateLimitDelay("zhenhunxiaoshuo.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được trang thể loại: " + target);

    var items = [];
    var seen = {};
    var links = doc.select("article.article-content table a[href]");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        if (href.indexOf(".html") !== -1) continue;
        if (href.indexOf("chaxun") !== -1) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        var link = absUrl(href);
        // Truyen 镇魂 trong bang link ve "/" -> sua thanh trang muc luc that.
        if (link === siteOrigin() + "/") link = siteOrigin() + "/lunhuigui/";
        if (seen[link]) continue;
        seen[link] = true;

        // Dang A: tac gia o <td> ke tiep trong cung <tr>.
        var author = "";
        try {
            var td = a.parent();
            if (td !== null) {
                var tr = td.parent();
                if (tr !== null) {
                    var tds = tr.select("td");
                    if (tds.size() === 2) author = cleanText(tds.get(1).text());
                }
            }
        } catch (e) {
        }

        items.push({
            name: name,
            link: link,
            author: author,
            cover: "",
            description: "",
            host: siteOrigin()
        });
    }

    if (items.length === 0) {
        return Response.error("Không có dữ liệu tại " + target);
    }
    return Response.success(items, "");
}
