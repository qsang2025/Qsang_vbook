// gen.js — Danh sach truyen theo the loai hoac danh muc Me Truyen Chu
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v4, N1):
// fetch qua fetchPageDoc() (fetchDocWithFallback + kiem challenge, tra
// loi tieng Viet co huong dan khi gap Cloudflare/login); parse danh sach
// ".truyen-list .item" dung chung parseStoryItems() trong helper.js (N2)
// — chi phan ".itemupdate" (trang chu "/") la rieng cua file nay.
// Trang list trong (0 truyen) la ket qua binh thuong, tra success rong
// (N3), khong bao error.
load('config.js');
load('safe-first.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url, page) {
    if (!url) return Response.error("Thiếu đường dẫn danh sách.");
    url = normalizeUrl(url);

    if (page && String(page) !== '1') {
        if (url.indexOf("?") !== -1) {
            url = url + "&page=" + page;
        } else {
            url = url + "?page=" + page;
        }
    }

    var r = fetchPageDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var novelList = parseStoryItems(doc);

    // Neu chua co truyen (vi du trang moi cap nhat .itemupdate)
    if (novelList.length === 0) {
        doc.select(".itemupdate").forEach(function(e) {
            var titleEl = e.select(".iname h3 a").first();
            if (!titleEl) return;

            var name = titleEl.text().trim();
            var link = titleEl.attr("href");
            if (!name || !link) return;

            var desc = "";
            var genreEl = e.select(".icate a").first();
            if (genreEl) {
                desc = genreEl.text().trim();
            }

            var chapterEl = safeFirst(e.select(".ichapter a"));
            if (chapterEl) {
                var chapterText = chapterEl.text().trim();
                if (desc) desc += " | " + chapterText;
                else desc = chapterText;
            }

            novelList.push({
                name: name,
                link: link,
                cover: "",
                description: desc,
                host: BASE_URL
            });
        });
    }

    // Trang list trong (the loai/trang khong co truyen) la ket qua binh
    // thuong: tra success rong thay vi error (N3).
    if (novelList.length === 0) {
        return Response.success([], "");
    }

    var currentPage = page ? parseInt(page, 10) : 1;
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
    // nextToken LUON la string: "" khi het trang, khong bao gio null.
    // Trang chu "/" khong co khoi phan trang nen tab "Moi Cap Nhat" tra "".
    var next = findNextPage(doc, currentPage);

    return Response.success(novelList, next);
}
