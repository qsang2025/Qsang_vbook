// up.js — tab "Mới Cập Nhật": 60 truyen moi cap nhat nhat o trang chu.
// Cau truc: .l ul li (s1 the loai, s2 a cuoi = ten + link truyen,
// s3 a = chuong moi nhat, s4 tac gia, s5 ngay). Trang chu khong co anh
// bia trong danh sach nay nen cover de trong (khong doan URL anh).
// Kiem chung live 2026-11-15: 60 muc.
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
    var rows = doc.select(".l ul li");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var linkEl = safeFirst(e.select(".s2 a"));
        if (!linkEl) continue;
        // .s2 co 2 link: [目] (muc luc) va ten truyen — lay link cuoi cung.
        var links = e.select(".s2 a");
        if (links.size() > 1) linkEl = links.get(links.size() - 1);
        var link = absUrl(linkEl.attr("href"));
        var name = cleanText(linkEl.text());
        var genre = cleanText(e.select(".s1").text());
        var chapter = cleanText(e.select(".s3 a").text());
        var author = cleanText(e.select(".s4").text());
        var date = cleanText(e.select(".s5").text());
        if (!name || !link) continue;
        var description = genre;
        if (date) description = description ? description + " - " + date : date;
        if (author) description = description ? description + " - " + author : author;
        if (chapter) description = description ? description + " - " + chapter : chapter;
        data.push({
            name: name,
            link: link,
            cover: "",
            description: description,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không đọc được danh sách mới cập nhật");
    return Response.success(data, "");
}
