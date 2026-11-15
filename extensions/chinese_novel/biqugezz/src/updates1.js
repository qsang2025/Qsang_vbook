// updates1.js — Tab "最新小说": 30 truyen moi len ke tren trang chu.
//
// Cau truc that (kiem chung live 2026-11-15), #zuixin ul li:
//   "[the loai] <a>ten truyen</a><span>tac gia</span>"
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
    var rows = doc.select("#zuixin ul li");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var el = rows.get(i);
        var linkEl = safeFirst(el.select("a"));
        if (linkEl === null) continue;
        var link = absUrl(linkEl.attr("href"));
        var name = cleanText(linkEl.text());
        if (!link || !name || seen[link]) continue;
        seen[link] = true;
        var authorEl = safeFirst(el.select("span"));
        var author = authorEl === null ? "" : cleanText(authorEl.text());
        items.push({
            name: name,
            cover: "",
            link: link,
            description: author,
            host: siteOrigin()
        });
    }
    if (items.length === 0) return Response.error("Không đọc được danh sách mới lên kệ (site có thể đã đổi giao diện).");
    return Response.success(items, "");
}
