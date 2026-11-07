// toc.js — muc luc chuong cua NiACG.
//
// Hai dang:
//   Series manga (showinfo-14/15-<id>-0.html): trang chua danh sach link
//     chuong dang /moehome-<class>-<chapterId>.html. Anchor text cua link
//     chuong GAN NHU TRONG (chi co so luot xem), nen ten chuong dat theo
//     thu tu tang dan cua chapterId: "Chương 1".."Chương N". Moi chuong
//     tro ve TRANG MOEHOME cua chuong do (khong phai moeupup): trang doc
//     that cua chuong truyen tranh la nut "开始阅读" (Bat dau doc) tren
//     trang moehome, tro toi /showinfo-16-<readId>-0.html — chap.js se
//     tu tim nut do de lay anh. (Kiem chung 2026-11-07: series 209 co
//     9 chuong, id 84, 101, 102, 103, 169, 171, 172, 180, 185; moi link
//     lap lai 3 lan tren trang. Chuong 101 co nut doc showinfo-16-3935,
//     chuong 84 co nut doc showinfo-16-3425.)
//   Gallery don (moehome hoac showinfo muc anh khac): 1 item = 1 bo anh,
//     tra ve 1 chuong duy nhat "Đọc toàn bộ" tro ve
//     /moeupup-<class>-<id>.html (toan bo anh tren 1 trang).
//   Chuong truyen tranh mo truc tiep (moehome-14/15): 1 chuong "Chương 1"
//     tro ve chinh trang moehome do.
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

    // Series manga: doc danh sach chuong tren trang showinfo.
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    var chapterIds = [];
    var seen = {};
    doc.select("a[href^=\"/moehome-" + classid + "-\"]").forEach(function (el) {
        var href = el.attr("href");
        var m = String(href || "").match(/\/moehome-\d+-(\d+)\.html/);
        if (!m) return;
        var cid = parseInt(m[1], 10);
        if (isNaN(cid) || seen[cid]) return;
        seen[cid] = true;
        chapterIds.push(cid);
    });

    if (chapterIds.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    }

    // Sap xep tang dan theo chapterId = thu tu doc (cu nhat truoc).
    chapterIds.sort(function (a, b) { return a - b; });

    var chapters = [];
    var i = 0;
    for (i = 0; i < chapterIds.length; i++) {
        chapters.push({
            name: "Chương " + (i + 1),
            url: moehomeUrl(classid, String(chapterIds[i])),
            description: "",
            lock: false,
            pay: false
        });
    }
    console.log("toc series: " + chapters.length + " chuong");
    return Response.success(chapters);
}
