// gen.js — danh sach truyen theo chuyen muc (execute(url, page) -> items, nextPage).
//
// Cac dang trang danh sach tren trxs.cc (deu GB2312, 20 truyen/trang):
//   /tongren/                  trang 1   (trang n>=2 -> /tongren/index_<n>.html, 1-based)
//   /tongren/index_<n>.html    trang n
//   /tags-<tagId>-<k>.html     0-based (k = page-1); trang cuoi la index lon nhat
//   /rating/                   1 trang, khong co #pageNum
// Moi trang ve item dang <div class="books"><div class="bk"><a href="/tongren/<id>.html">
//   <div class="pic"><img src=... alt=...></div><div class="infos"><h3>ten(pham vi)</h3>
//   <div class="booknews">作者: X ..</div><p>...</p></div></a>
// Pager nam o <div class="page" id="pageNum">; so lon nhat trong href la so trang
// cuoi (tongren: 1-based; tags: 0-based index nen trang cuoi = index + 1).
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

// Giai URL danh sach that cho so trang 1-based cua app.
// App truyen {{page}} la "" o trang tab dau tien, nen chuan hoa page o day
// thay vi thay the placeholder mot cach mu.
function buildUrl(input, page) {
    var u = String(input || "");
    var p = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(p, 10);
    if (isNaN(pn) || pn < 1) pn = 1;

    var m = u.match(/^(https?:\/\/[^\/]+)\/tags-(\d+)-(\d+)\.html$/);
    if (m) return m[1] + "/tags-" + m[2] + "-" + (pn - 1) + ".html";

    m = u.match(/^(https?:\/\/[^\/]+)\/tongren\/(?:index(?:_\d+)?\.html)?$/);
    if (m) {
        if (pn === 1) return m[1] + "/tongren/";
        return m[1] + "/tongren/index_" + pn + ".html";
    }

    u = u.replace("{{page}}", p === "" ? "1" : p);
    return u;
}

// So trang cuoi ma pager #pageNum cua site quang cao (khong co => 1 trang).
function maxPage(doc) {
    var sel = doc.select("#pageNum a[href]");
    var best = 0;
    for (var i = 0; i < sel.size(); i++) {
        var h = String(sel.get(i).attr("href") || "");
        var m = h.match(/(\d+)(?:\.html)?$/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    return best;
}

function execute(url, page) {
    var target = buildUrl(url, page);
    var r = fetchTrxsDoc(target);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var data = parseListItems(doc);
    if (data.length === 0) return Response.error("Không có dữ liệu tại " + target);

    var next = "";
    var mp = maxPage(doc);
    if (mp > 0) {
        var pn = parseInt(String(page || "1").replace(/\s/g, ""), 10);
        if (isNaN(pn) || pn < 1) pn = 1;
        // /tags-N-<k>.html la 0-based: so lon nhat trong pager la index cua
        // trang cuoi, tuc trang app cuoi la mp + 1 — con trang tiep khi pn <= mp.
        // /tongren/ la 1-based: so lon nhat la so trang cuoi — con khi pn < mp.
        var isTags = target.indexOf("/tags-") !== -1;
        if (isTags ? pn <= mp : pn < mp) next = String(pn + 1);
    }
    return Response.success(data, next);
}
