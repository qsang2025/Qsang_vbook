// gen.js — danh sach truyen theo the loai cua 乐文小说.
// Input: tien to duong dan the loai, vd "/leibie1_" (trang N: /leibie1_N.html).
// Moi trang 50 truyen, cau truc #alistbox > div (anh bia + ten + tac gia
// + chuong moi nhat). Kiem chung live 2026-11-15: /leibie1_1.html 200,
// 50 muc, co nut "下一页" (a.next) khi con trang sau.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    var pageNo = parseInt(page || "1", 10);
    if (!pageNo || pageNo < 1) pageNo = 1;
    var path = String(url || "");
    if (path.indexOf("http") === 0) {
        // Neu app truyen URL day du thi chi lay phan path, bo so trang cuoi.
        var m = path.match(/^(?:https?:\/\/[^\/]+)(\/.*)$/);
        path = m ? m[1] : path;
        path = path.replace(/_\d+\.html$/, "_");
    }
    if (!path) return Response.error("Thiếu đường dẫn thể loại");
    var target = BASE_URL + path + pageNo + ".html";
    var res = fetchPage(target);
    if (!res.ok) return Response.error("Không tải được danh sách (HTTP " + res.status + ")");
    var doc = res.html();
    var data = [];
    var rows = doc.select("#alistbox > div");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var linkEl = safeFirst(e.select(".pic a"));
        if (!linkEl) continue;
        var link = absUrl(linkEl.attr("href"));
        var imgEl = safeFirst(e.select(".pic img"));
        var name = imgEl ? cleanText(imgEl.attr("alt")) : "";
        var cover = imgEl ? imgEl.attr("src") : "";
        var author = cleanText(e.select(".title span").text()).replace("作者：", "");
        var chapter = cleanText(e.select(".sys li a").text());
        if (!name || !link) continue;
        var description = author;
        if (chapter) description = description ? description + " - " + chapter : chapter;
        data.push({
            name: name,
            link: link,
            cover: cover || "",
            description: description,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không có truyện nào trong danh sách này");
    var next = "";
    if (safeFirst(doc.select(".page a.next"))) next = String(pageNo + 1);
    return Response.success(data, next);
}
