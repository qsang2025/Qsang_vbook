// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [chuong]).
//
// Trang chi tiet co 2 khoi .directoryArea: khoi 1 id="chapterlist"
// (5 chuong moi nhat), khoi 2 la muc luc chinh cua trang hien tai
// (20 chuong/trang). Ham lay khoi CUOI CUNG (kiem chung live
// 2026-11-15: 万族之劫 trang 1: ch.1 "第1章 父子" -> ch.20;
// trang 2 (/bqg/223080_2/): ch.21 -> ch.39 + 1 chuong ngoai le
// "来啊，聊五毛钱的！"). Bo trung theo href (phong thu),
// giu thu tu gap dau tien.
// Ham nhan ca URL trang chi tiet (/bqg/<id>/) va URL trang muc luc
// (/bqg/<id>_<n>/); truong hop sau thi fetch thang URL do.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("Link truyện không hợp lệ.");
    var tocUrl = "";
    if (/\/bqg\/\d+_\d+\/?$/i.test(String(url))) {
        tocUrl = absUrl(url);
    } else {
        tocUrl = BASE_URL + "/bqg/" + id + "/";
    }
    var r = fetchDyDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var areas = doc.select(".directoryArea");
    if (areas.size() === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }
    var mainArea = areas.get(areas.size() - 1);
    var links = mainArea.select("p a");
    if (links.size() === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }

    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }
    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    }
    return Response.success(chapters);
}
