// toc.js — Muc luc chuong 1 truyen Ky Huyen (kyhuyen.com).
//
// Trang chi tiet chua toan bo muc luc, chia tab 200 chuong/tab (kiem chung
// live 2026-11-18, truyen 880 chuong): tab-but-1 "Moi nhat" chi co 10
// chuong moi nhat (BO QUA — trung voi cac tab khoang), tab-but-2..N la
// cac khoang "1-201", "202-401"...; noi dung moi tab o .tab-content-N
// tuong ung. Tra ve tieu de khoang dang section + tung chuong
// { name, url } (dedupe theo href). execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");

    var r = fetchKyDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var list = [];
    var seen = {};
    var buttons = doc.select(".tabs .tab-but");

    function pushChapter(el) {
        var href = el.attr("href") || "";
        var chapName = cleanText(el.text());
        if (!href || !chapName || seen[href]) return;
        seen[href] = true;
        list.push({
            name: chapName,
            url: absUrl(href)
        });
    }

    if (buttons.size() > 0) {
        var i = 0;
        for (i = 0; i < buttons.size(); i++) {
            var btn = buttons.get(i);
            if (!btn) continue;
            var sectionName = cleanText(btn.text());
            // Bo qua tab "Moi nhat" (tab dau tien): chi 10 chuong moi,
            // trung lap voi cac tab khoang day du ben duoi.
            if (sectionName.indexOf("Mới nhất") >= 0 || i === 0) continue;

            var contentEl = null;
            var btnClass = btn.attr("class") || "";
            var numMatch = btnClass.match(/tab-but-(\d+)/);
            if (numMatch) {
                contentEl = safeFirst(doc.select(".tab-content-" + numMatch[1]));
            }
            if (contentEl === null) {
                var contents = doc.select(".tab-content.tab-chap");
                if (i < contents.size()) contentEl = contents.get(i);
            }
            if (contentEl !== null) {
                list.push({ name: sectionName, type: "section" });
                var chaps = contentEl.select(".chapters ul li a");
                var j = 0;
                for (j = 0; j < chaps.size(); j++) pushChapter(chaps.get(j));
            }
        }
    }

    // Du phong: khong co tab thi gom tat ca link chuong tren trang.
    if (list.length === 0) {
        var all = doc.select(".tab-chap .chapters ul li a");
        if (all.size() === 0) all = doc.select(".chapters ul li a");
        var k = 0;
        for (k = 0; k < all.size(); k++) pushChapter(all.get(k));
    }

    if (list.length === 0) return Response.error("Không đọc được danh sách chương: " + tocUrl);
    return Response.success(list);
}
