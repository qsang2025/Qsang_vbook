// updates.js — Tab "最近更新": 30 truyen moi cap nhat tren trang chu.
//
// Cau truc that (kiem chung live 2026-11-15), #gengxin ul li:
//   span.s1 (the loai) / span.s2 a (ten + link truyen)
//   span.s3 a (chuong moi nhat) / span.s5 (ngay gio) / span.s4 (tac gia)
// Khong phan trang (chi 30 muc dau) -> next = "".
// Khong co anh bia o danh sach — cover lay o detail (og:image).
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

function execute(url, page) {
    var homeUrl = normalizeUrl(BASE_URL + "/");
    var r = fetchBqDoc(homeUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    var rows = doc.select("#gengxin ul li");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var el = rows.get(i);
        var linkEl = safeFirst(el.select(".s2 a"));
        if (linkEl === null) continue;
        var link = absUrl(linkEl.attr("href"));
        var name = cleanText(linkEl.text());
        if (!link || !name || seen[link]) continue;
        seen[link] = true;
        var authorEl = safeFirst(el.select(".s4"));
        var author = authorEl === null ? "" : cleanText(authorEl.text());
        var chapEl = safeFirst(el.select(".s3 a"));
        var latest = chapEl === null ? "" : cleanText(chapEl.text());
        var dateEl = safeFirst(el.select(".s5"));
        var date = dateEl === null ? "" : cleanText(dateEl.text());
        var desc = author;
        if (latest) desc = desc ? desc + " — " + latest : latest;
        if (date) desc = desc ? desc + " (" + date + ")" : date;
        items.push({
            name: name,
            cover: "",
            link: link,
            description: desc,
            host: siteOrigin()
        });
    }
    if (items.length === 0) return Response.error("Không đọc được danh sách mới cập nhật (site có thể đã đổi giao diện).");
    return Response.success(items, "");
}
