// toc.js — muc luc chuong cua NiACG.
//
// Hai dang:
//   Series manga (showinfo-14/15-<id>-0.html): danh sach chuong THAT nam
//     trong <div class="episode"> — moi chuong la link
//     /showinfo-16-<readId>-0.html (trang doc truc tiep), ten that trong
//     <li class="current_series"> (vd 第1话). Xoa <span class="hidden-xs">
//     chua timestamp truoc khi lay ten, neu khong ten se dinh kem so
//     (vd "第11话1689656426"). Trang liet ke moi nhat truoc (第11话 dau)
//     nen dao nguoc de duoc cu -> moi (第1话 dau).
//     (Kiem chung 2026-11-07 tren showinfo-14-209: 11 tap 第1话–第11话
//     -> showinfo-16-5692..5702. Truoc day (v1) doc link
//     /moehome-<class>-<id> trong carousel tac pham lien quan
//     (.thumb-overlay-albums) va dat ten gia "Chương N" — SAI, bam vao
//     mo nham tac pham khac. Da sua theo cach cua ban Antigravity.)
//   Gallery don (moehome hoac showinfo muc anh khac): 1 item = 1 bo anh,
//     tra ve 1 chuong duy nhat "Đọc toàn bộ" tro ve
//     /moeupup-<class>-<id>.html (toan bo anh tren 1 trang).
//   Chuong truyen tranh mo truc tiep (moehome-14/15): 1 chuong "Chương 1"
//     tro ve chinh trang moehome do (chap.js se tim nut "开始阅读" de lay
//     trang doc showinfo-16).
// Khong co phan trang muc luc (khong can page.js).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var classid = classIdOf(url);
    var id = itemIdOf(url);
    if (!classid || !id) return Response.error("Không đọc được mục/id từ URL: " + url);

    // Chuong truyen tranh (moehome-14/15) mo truc tiep: chi co 1 chuong do.
    if (url.indexOf("/moehome-") !== -1 && isSeriesClass(classid)) {
        return Response.success([{
            name: "Chương 1",
            url: moehomeUrl(classid, id),
            description: "",
            lock: false,
            pay: false
        }]);
    }

    // Gallery don: 1 chuong duy nhat.
    if (!isSeriesUrl(url)) {
        return Response.success([{
            name: "Đọc toàn bộ",
            url: moeupupUrl(classid, id),
            description: "",
            lock: false,
            pay: false
        }]);
    }

    // Series manga: doc danh sach chuong THAT trong <div class="episode">.
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    // Xoa span timestamp trong moi link chuong truoc khi lay ten.
    var dateSpans = doc.select(".episode .hidden-xs");
    dateSpans.remove();

    var chapters = [];
    var seen = {};
    doc.select(".episode a[href*=\"showinfo-16-\"]").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        var name = "";
        var li = el.select("li").first();
        if (li !== null) name = cleanText(li.text());
        if (!name) name = cleanText(el.text());
        if (!name) return;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    }

    // Trang liet ke moi nhat truoc -> dao nguoc de chuong cu nhat len dau.
    chapters.reverse();
    console.log("toc series: " + chapters.length + " chuong");
    return Response.success(chapters);
}
