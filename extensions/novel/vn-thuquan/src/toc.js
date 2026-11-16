// toc.js — Muc luc (execute(url) -> [chuong]).
//
// Muc luc qua API chinh thuc cua site (kiem chung live 2026-11-16):
// GET /api/tacpham/get-mucluc?tuaId=<id>&page=<p>&pageSize=100
// -> {success, chapters:[{chuongId, title}]} (Tay Son 71 chuong,
// Thuy Hu 70 chuong). API khong tra total nen lap trang den khi 1 trang
// tra < 100 muc (toi da 50 trang). URL chuong:
// /TacPham/<slug>-<id>/chuong-<chuongId>.
// Fallback: neu API khong tra muc nao thi doc modal muc luc tren trang
// chi tiet (#vntqTocList a.vntq-toc-item — chi co trang 1, toi da 100 muc).
// Khong can page.js: API lap trang o day da du.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeVntqUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var id = bookId(url);
    var slugId = bookSlugId(url);
    if (!id || !slugId) return Response.error("Đường dẫn truyện không hợp lệ.");

    var items = [];
    var seen = {};
    var page = 1;
    var done = false;
    while (!done && page <= 50) {
        var apiUrl = BASE_URL + "/api/tacpham/get-mucluc?tuaId=" + id + "&page=" + page + "&pageSize=100";
        var data = fetchVntqJson(apiUrl);
        if (!data || !data.success || !data.chapters || !(data.chapters instanceof Array)) break;
        var chs = data.chapters;
        for (var i = 0; i < chs.length; i++) {
            var ch = chs[i];
            var cid = 0;
            try { cid = parseInt(ch.chuongId, 10); } catch (e) { cid = 0; }
            if (isNaN(cid) || cid <= 0) continue;
            var curl = BASE_URL + "/TacPham/" + slugId + "/chuong-" + cid;
            if (seen[curl]) continue;
            var nm = "";
            try { nm = cleanText(ch.title); } catch (e2) { nm = ""; }
            if (!nm) nm = "Chương " + cid;
            seen[curl] = 1;
            items.push({ name: nm, url: curl });
        }
        if (chs.length < 100) done = true;
        page++;
        if (!done) jitterDelay();
    }

    if (items.length === 0) {
        // Fallback: doc modal muc luc tren trang chi tiet.
        var r = fetchVntqDoc(url);
        if (r.error) return Response.error(r.error);
        var links = r.doc.select("#vntqTocList a.vntq-toc-item");
        for (var j = 0; j < links.size(); j++) {
            var a = links.get(j);
            var href = String(a.attr("href") || "");
            var m = href.match(/\/chuong-(\d+)/);
            if (!m) continue;
            var curl2 = normalizeVntqUrl(href);
            if (seen[curl2]) continue;
            var nm2 = cleanText(a.text());
            if (!nm2) continue;
            seen[curl2] = 1;
            items.push({ name: nm2, url: curl2 });
        }
    }

    if (items.length === 0) return Response.error("Không đọc được mục lục.");
    return Response.success(items);
}
