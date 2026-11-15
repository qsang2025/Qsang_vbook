// up1.js — tab "Mới Lên Kệ": 60 truyen moi len ke o trang chu.
// Cau truc: .r ul li (s1 the loai, s2 a cuoi = ten + link truyen,
// s2 span cuoi = tac gia, s5 ngay). Khong co anh bia trong danh sach nay.
// Kiem chung live 2026-11-15: 60 muc.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    // FIX 2026-11-15: dung fetchDoc (xem chap.js) — fetchPage + .html()
    // crash khi fetchPage tra ve doi tuong browser-fallback {doc, ok: true}
    // hoac null (gap tren may that: HTTP 504 -> TypeError o .html()).
    var doc = fetchDoc(BASE_URL + (url || ""));
    if (!doc) return Response.error("Không tải được trang chủ, thử lại sau");
    var data = [];
    var rows = doc.select(".r ul li");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var links = e.select(".s2 a");
        if (links.size() === 0) continue;
        var linkEl = links.get(links.size() - 1);
        var link = absUrl(linkEl.attr("href"));
        var name = cleanText(linkEl.text());
        // Ten truyen co the dinh dau "/" le (vd ".../tac gia" nam ngoai the a
        // thi khong anh huong; chi cat dau "/" neu co o cuoi ten).
        if (name.charAt(name.length - 1) === "/") name = name.substring(0, name.length - 1);
        var genre = cleanText(e.select(".s1").text());
        var spans = e.select(".s2 span");
        var author = spans.size() > 0 ? cleanText(spans.get(spans.size() - 1).text()) : "";
        var date = cleanText(e.select(".s5").text());
        if (!name || !link) continue;
        var description = genre;
        if (author) description = description ? description + " - " + author : author;
        if (date) description = description ? description + " - " + date : date;
        data.push({
            name: name,
            link: link,
            cover: "",
            description: description,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không đọc được danh sách mới lên kệ");
    return Response.success(data, "");
}
