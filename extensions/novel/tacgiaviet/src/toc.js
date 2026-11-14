// toc.js — Danh sach chuong cua MOT trang muc luc (20 chuong).
// URL vao la URL chi tiet hoac mot URL trang muc luc do page.js tra.
// Ten chuong dang "Chuơng N: Tua ngay/thang/nam" — cat ngay o cuoi.
// Chuong khoa co icon is-locked trong hang thi danh dau lock/pay.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var rr = ttlFetchDoc(normalizeUrl(url));
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];
    var rows = doc.select(".story-detail-chapter-list a.story-detail-chapter-row");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var href = row.attr("href") || "";
        if (!href) continue;
        var spanEl = selFirst(row, "span");
        var name = spanEl ? cleanText(spanEl.text()) : cleanText(row.text());
        // Cat ngay dang o cuoi ten (" ... 04/10/2026").
        name = name.replace(/\s+\d{1,2}\/\d{1,2}\/\d{4}\s*$/, "");
        if (!name) continue;
        var locked = row.select(".is-locked").size() > 0;
        data.push({
            name: name,
            url: normalizeUrl(href),
            lock: locked,
            pay: locked,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(data);
}
