// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, ...}]).
// Trang detail chua .chapter-list voi .chapter-item (50 chuong/trang):
//   <li class="chapter-item" data-id="...">
//     <a href="/chuong-N-<slug>/">Chuong N: Ten</a><time>dd/mm/yyyy</time>
//   </li>
// Chu y: thu tu chuong tren site KHONG don dieu (2 luong danh so chong
// len nhau, vd. trang 31 la ch.140-189) — tra nguyen thu tu site, khong
// sap xep lai. Nhieu chuong trong khoang trang 10-22 cua mot so truyen
// bi web goc de trong noi dung; toc van liet ke day du.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    var target = normalizeUrl(url);
    rateLimitDelay("khotruyenchu.fun", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được mục lục: " + target);

    var chapters = [];
    var seen = {};
    var items = doc.select(".chapter-item");
    var i = 0;
    for (i = 0; i < items.size(); i++) {
        var li = items.get(i);
        var a = safeFirst(li.select("a[href]"));
        if (!a) continue;
        var name = cleanText(a.text());
        var href = String(a.attr("href") || "");
        if (!name || !href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            host: siteOrigin(),
            description: cleanText(li.select("time").text()),
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + target);
    }
    return Response.success(chapters);
}
