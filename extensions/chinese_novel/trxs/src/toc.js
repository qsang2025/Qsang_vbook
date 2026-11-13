// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, host}]).
//
// Nguon chinh: danh sach chuong inline tren trang sach
//   div.book_list > ul > li > a[href="/tongren/<id>/<n>.html"]   ten dang "第1节"
// Fallback (da kiem chung can cho vd /tongren/11670.html va /tongren/6072.html,
// trang sach khong co list): doc link 尾章 o chuong 1 roi sinh 1..<cuoi>.
// Chap nhan ca URL trang sach lan URL chuong.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
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
    var u = String(url || "");
    var m = u.match(/\/tongren\/(\d+)(?:\.html|\/(\d+)\.html)?/);
    if (!m) return Response.error("URL không hợp lệ: " + url);
    var id = m[1];
    var bookUrl = BASE_URL + "/tongren/" + id + ".html";

    var r = fetchTrxsDoc(bookUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var data = [];
    var seen = {};
    var sel = doc.select(".book_list ul li a[href]");
    for (var i = 0; i < sel.size(); i++) {
        var a = sel.get(i);
        var href = String(a.attr("href") || "");
        var mm = href.match(/^\/tongren\/(\d+)\/(\d+)\.html$/);
        if (!mm || mm[1] !== id) continue;
        var link = BASE_URL + href;
        if (seen[link]) continue;
        var name = cleanText(a.text());
        if (!name) name = "第" + mm[2] + "节";
        seen[link] = 1;
        data.push({ name: name, url: link, host: BASE_URL });
    }

    if (data.length === 0) {
        // Trang sach khong co list inline: lay pham vi tu link 尾章 o chuong 1.
        var r1 = fetchTrxsDoc(BASE_URL + "/tongren/" + id + "/1.html");
        if (r1.error) return Response.error("Mục lục trống cho truyện " + id);
        var c1 = r1.doc;
        var nav = c1.select(".pageNav a[href]");
        var last = 0;
        for (var j = 0; j < nav.size(); j++) {
            var h = String(nav.get(j).attr("href") || "");
            var t = cleanText(nav.get(j).text());
            var mm2 = h.match(/^\/tongren\/(\d+)\/(\d+)\.html$/);
            if (!mm2 || mm2[1] !== id) continue;
            if (t.indexOf("尾章") !== -1) {
                var n = parseInt(mm2[2], 10);
                if (!isNaN(n) && n > last) last = n;
            }
        }
        if (last < 1) return Response.error("Không tìm thấy danh sách chương cho truyện " + id);
        for (var k = 1; k <= last; k++) {
            data.push({ name: "第" + k + "节", url: BASE_URL + "/tongren/" + id + "/" + k + ".html", host: BASE_URL });
        }
    }

    if (data.length === 0) return Response.error("Mục lục trống cho truyện " + id);
    return Response.success(data);
}
