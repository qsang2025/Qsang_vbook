// toc.js — muc luc chuong cua mot truyen tren Tadu.
// Endpoint: /book/catalogue/<bid> — tra toan bo chuong trong 1 trang
// (kiem chung: truyen 284 chuong va 438 chuong deu 1 trang, khong phan
// trang). Link chuong nam trong div.chapter.clearfix; href co khoang
// trang thua 2 dau ("  /book/826953/95446330/ ") nen phai trim truoc
// khi dung. Ten chuong dang "第1章 ..." giu nguyen.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = toWww(url);
    var parts = normalizeUrl(url).split("/").filter(function (s) { return !!s; });
    var bid = parts.length > 0 ? parts[parts.length - 1] : "";
    if (!bid || parts[0] !== "book") return Response.error("URL truyện không hợp lệ.");

    var response = fetchPage(BASE_URL + "/book/catalogue/" + bid);
    if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");

    var doc = response.html();
    var chapters = [];
    var seen = {};
    var links = doc.select("div.chapter a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var name = cleanText(el.text());
        var link = buildAbsoluteUrl(el.attr("href"));
        if (!name || !link) continue;
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({ name: name, url: link, description: "", lock: false, pay: false });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện)");
    return Response.success(chapters);
}
