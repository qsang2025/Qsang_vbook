// toc.js — Muc luc chuong cua mot truyen (Zongheng).
// Contract: execute(url) -> [{ name*, url*, description?, lock?, pay? }].
// Input la URL chi tiet (www/detail/{id}, book/book/{id}.html,
// huayu/book/{id}.html); tu bookId dung URL muc luc
//   https://book.zongheng.com/showchapter/{id}.html (nam tan)
//   https://huayu.zongheng.com/showchapter/{id}.html (nu tan)
// Trang muc luc chi co 1 trang (kiem chung 2026-11-11: 剑来 1312 chuong
// tren 1 trang), khong can page.js.
// Selector (con nguyen 100% so voi base v4): div.volume-list li;
// chuong VIP co class "vip" trong li (1225/1312 chuong o 剑来),
// chuong thuong co class " col-4" (co khoang trang dau).
// Ten chuong lay tu <a>, mo ta lay tu title attr (so chu + gio cap nhat).
// Load: file rate-limit.js (pacing + retry).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");

function execute(url) {
    url = zhNormalizeUrl(url);
    var idMatch = String(url).match(/\/(?:detail|book)\/(\d+)/);
    if (!idMatch) return Response.error("Không lấy được mã truyện từ URL: " + url);
    var bookId = idMatch[1];
    var isHuayu = String(url).indexOf("huayu.zongheng.com") > -1;
    var tocUrl = (isHuayu ? "https://huayu.zongheng.com/showchapter/" : "https://book.zongheng.com/showchapter/") + bookId + ".html";
    var pf = pacedFetch(tocUrl, { headers: zhHeaders(tocUrl) });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Zongheng", "zongheng.com", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được mục lục (HTTP " + pf.status + "): " + tocUrl);
    }
    var doc = pf.res.html();
    var chapters = [];
    var seen = {};
    doc.select("div.volume-list li").forEach(function (el) {
        var aEl = zhFirst(el.select("a"));
        if (!aEl) return;
        var href = (aEl.attr("href") || "") + "";
        if (!href) return;
        var link = zhResolve(href, tocUrl);
        if (seen[link]) return;
        seen[link] = true;
        var cls = (el.attr("class") || "") + "";
        var vip = cls.indexOf("vip") > -1;
        var name = zhCleanText(aEl.text());
        if (!name) return;
        chapters.push({
            name: (vip ? "[VIP] " : "") + name,
            url: link,
            description: (aEl.attr("title") || "") + "",
            lock: false,
            pay: vip
        });
    });
    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
