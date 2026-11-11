// toc.js — muc luc chuong cua 思兔閱讀 (sto9.com).
// DAC BIET: trang /book/{id}/index.html CHI chua 36 link (15 dau
// li[data-num="1"–"15"] + 21 cuoi li[data-num="853"–"873"]), KHONG phan
// trang. Full list o endpoint AJAX:
//   GET https://sto9.com/ajax_novels/chapterlist/{id}.html
// (khao sat 2026-11-07: 200, text/html UTF-8, ~104KB, fragment <ul> du
// 873 <li data-num="1..873">, moi item <a href="/txt/{id}/{cid}.html">,
// khong chuong khoa/VIP). toc.js PHAI fetch endpoint AJAX nay; trang
// index chi lam fallback dau/cuoi.
// Vi du: 夜無疆 id 671 — 873 muc = 870 chuong danh so + 1 muc cam on
// + 2 muc "休息一天". Chuong 1: 第1章 永夜 -> /txt/671/83151.html;
// chuong cuoi 第870章 -> /txt/671/9247693.html. ID chuong la so mo
// (83151 cho chuong 1) — KHONG sort theo so trong URL, giu dung thu
// tu DOM. Khong can page.js.
// LOC MUC KHONG PHAI CHUONG (v4, kiem chung live 2026-11-09 tren 5 truyen:
// 671, 1, 12067, 12058, 2192, 2234): muc luc lan ca ghi chu cua tac gia
// (vd 聖墟 25/1696 muc: 求月票, 請假, 抽獎, 感言, 新書...). Chi loc muc
// KHONG danh so "第…章" (chuong danh so luon giu); muc chua 番外/終章/
// 後記/楔子/序章/... la noi dung doc duoc that nen luon giu, ke ca khi
// ten co lan tu khoa rac (vd "月票番外與九月抽獎"). Muc khong phan biet
// chac chan duoc (vd "說幾句？", "你太沒禮貌了", "結束於10月") thi GIU
// (loc thieu an toan hon loc nham). Xem isNonChapterNote() trong addChapter.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('safe-first.js');
load('helper.js');

// Muc khong phai chuong = ghi chu cua tac gia (xin nghi, xin phieu,
// cam on, quang cao sach moi...). Chi xet muc KHONG danh so "第…章".
// Muc la noi dung doc duoc that (番外, 終章, 後記, 楔子, 序章, 引子,
// 前言, 大結局, 尾聲) luon giu — ke ca khi ten co lan tu khoa rac.
function isNonChapterNote(name) {
    if (/^第/.test(name)) return false;
    if (/(番外|終章|终章|後記|后记|楔子|序章|引子|前言|大結局|大结局|尾聲|尾声)/.test(name)) return false;
    return /(感謝|感谢|休息|請假|请假|月票|抽獎|抽奖|中獎|中奖|名單|名单|感言|新書|新书|打賞|打赏|投票|推薦票|推荐票|呼喚|呼唤|上架)/.test(name);
}

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/book\/(\d+)/);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    var chapters = [];
    var seen = {};

    function addChapter(el) {
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf("/txt/") === -1) return;
        if (isNonChapterNote(name)) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }

    // Nguon chinh: endpoint AJAX tra full list (gi du thu tu DOM).
    var ajaxUrl = BASE_URL + "/ajax_novels/chapterlist/" + bookId + ".html";
    var doc = fetchDocWithFallback(ajaxUrl, MIRROR_LIST);
    if (doc) {
        doc.select("li a").forEach(addChapter);
    }

    // Fallback: trang index (chi 36 link dau/cuoi).
    if (chapters.length === 0) {
        var indexUrl = BASE_URL + "/book/" + bookId + "/index.html";
        var doc2 = fetchDocWithFallback(indexUrl, MIRROR_LIST);
        if (doc2) {
            doc2.select("ul.row a").forEach(addChapter);
            if (chapters.length === 0) {
                doc2.select('a[href*="/txt/"]').forEach(addChapter);
            }
        }
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
