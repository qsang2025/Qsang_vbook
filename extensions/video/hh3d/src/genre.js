// genre.js — danh sach the loai phim cua HH3D (hh3d.ad).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var list = [];
    var seen = {};
    var doc = fetchDocWithFallback(BASE_URL + "/", MIRROR_LIST);
    if (doc) {
        var links = doc.select("a[href*='/the-loai/']");
        var i = 0;
        for (i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = String(a.attr("href") || "");
            var title = cleanText(a.text());
            if (!href || !title) continue;
            var path = absUrl(href).replace(/^https?:\/\/[^\/]+/i, "");
            if (path.indexOf("/the-loai/") !== 0) continue;
            if (seen[path]) continue;
            seen[path] = true;
            list.push({ title: title, input: path, script: "search.js" });
        }
    }
    if (list.length === 0) {
        list = [
            { title: "Huyền Huyễn", input: "/the-loai/huyen-huyen/", script: "search.js" },
            { title: "Tiên Hiệp", input: "/the-loai/tien-hiep/", script: "search.js" },
            { title: "Kiếm Hiệp", input: "/the-loai/kiem-hiep/", script: "search.js" },
            { title: "Xuyên Không", input: "/the-loai/xuyen-khong/", script: "search.js" },
            { title: "Trùng Sinh", input: "/the-loai/trung-sinh/", script: "search.js" },
            { title: "Cổ Trang", input: "/the-loai/co-trang/", script: "search.js" },
            { title: "Hiện Đại", input: "/the-loai/hien-dai/", script: "search.js" },
            { title: "Hài Hước", input: "/the-loai/hai-huoc/", script: "search.js" }
        ];
    }
    return Response.success(list);
}
