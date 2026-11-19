// toc.js — Muc luc chuong 1 truyen Truyen Kim Dung (truyenkimdung.net).
//
// Trang chi tiet chua toan bo muc luc (kiem chung live 2026-11-19, truyen
// mau Bich Huyet kiem 20 hoi): .chapter-items li a, moi chuong gom
// span "Hoi N" + strong ten hoi, href /truyen/<slug>/hoi-<n>-<slug-chuong>.
// Tra ve tung chuong { name: "Hoi N: <ten hoi>", url } (dedupe theo href).
// execute(url).
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

    var r = fetchTkDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var list = [];
    var seen = {};
    var chaps = doc.select(".chapter-items li a");
    var i = 0;
    for (i = 0; i < chaps.size(); i++) {
        var el = chaps.get(i);
        if (!el) continue;
        var href = el.attr("href") || "";
        if (!href || href.indexOf("/hoi-") === -1 || seen[href]) continue;

        var numEl = safeFirst(el.select("span"));
        var num = numEl ? cleanText(numEl.text()) : "";
        var strongEl = safeFirst(el.select("strong"));
        var chapTitle = strongEl ? cleanText(strongEl.text()) : "";
        var chapName = "";
        if (num && chapTitle) chapName = num + ": " + chapTitle;
        else chapName = cleanText(el.text());
        if (!chapName) continue;

        seen[href] = true;
        list.push({
            name: chapName,
            url: absUrl(href)
        });
    }

    if (list.length === 0) return Response.error("Không đọc được danh sách chương: " + tocUrl);
    return Response.success(list);
}
