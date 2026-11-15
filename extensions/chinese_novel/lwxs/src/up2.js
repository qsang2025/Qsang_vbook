// up2.js — tab "Sách Mới Nổi Bật": bang xep hang sach moi (.GARAN .top).
// Cau truc moi muc: .image img (anh bia that), dl dt a (ten + link),
// dt co dang "Ten / 著：Tac gia", dl dd (tom tat). Kiem chung live
// 2026-11-15: 33 muc.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    var res = fetchPage(BASE_URL + (url || ""));
    if (!res.ok) return Response.error("Không tải được trang chủ (HTTP " + res.status + ")");
    var doc = res.html();
    var data = [];
    var rows = doc.select(".GARAN .top");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var linkEl = safeFirst(e.select("dl dt a"));
        if (!linkEl) continue;
        var link = absUrl(linkEl.attr("href"));
        var name = cleanText(linkEl.text());
        var dtText = cleanText(e.select("dl dt").text());
        var author = "";
        var ai = dtText.indexOf("著：");
        if (ai !== -1) author = dtText.substring(ai + 2);
        var description = cleanText(e.select("dl dd").text());
        var imgEl = safeFirst(e.select(".image img"));
        var cover = imgEl ? imgEl.attr("src") : "";
        if (!name || !link) continue;
        if (author) description = "[" + author + "] " + description;
        data.push({
            name: name,
            link: link,
            cover: cover || "",
            description: description,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không đọc được bảng xếp hạng sách mới");
    return Response.success(data, "");
}
