// detail.js — Thong tin chi tiet mot truyen (ban lite).
//
// Ten h1 trong .novel-head; bia .novel-head .cover img; dong meta
// p.muted.small ("Ongoing · Author: ... · Translator: ... · N
// chapters"); tom tat trong div.chapter-body sau h2 Synopsis. Trang
// chi tiet lite KHONG co the loai (genres tra mang rong). So chuong
// trong dong meta la tong cua web chinh (vi du Beyond the Zenith ghi
// 194 trong khi lite chi co 190) nen KHONG dua vao detail — muc luc
// noi len so chuong that.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var name = cleanText(doc.select(".novel-head h1").text());
    if (!name) name = cleanText(doc.select("h1").text());
    if (!name) return Response.error("Không đọc được trang truyện: " + url);

    var cover = "";
    var img = selFirst(doc, ".novel-head .cover img");
    if (img) cover = absUrl(img.attr("src") || "");

    var meta = cleanText(doc.select("p.muted.small").text());
    var author = "";
    var translator = "";
    var status = "";
    if (meta) {
        var parts = meta.split("·");
        for (var i = 0; i < parts.length; i++) {
            var p = cleanText(parts[i]);
            if (p.indexOf("Author:") === 0) author = cleanText(p.substring(7));
            else if (p.indexOf("Translator:") === 0) translator = cleanText(p.substring(11));
            else if (p === "Ongoing" || p === "Completed" || p === "Hiatus") status = p;
        }
    }
    var ongoing = status !== "Completed";

    var descEl = selFirst(doc, "div.chapter-body");
    var description = descEl ? descEl.html() : "";

    var detail = "";
    if (author) detail += "Tác giả: " + author + "<br>";
    if (translator) detail += "Dịch: " + translator + "<br>";
    detail += status ? ("Trạng thái: " + status + "<br>") : (ongoing ? "Trạng thái: Ongoing<br>" : "Trạng thái: Completed<br>");
    detail += "Lưu ý: một số chương mới chỉ có bản xem trước hoặc yêu cầu đăng nhập trên WuxiaWorld.";

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: []
    });
}
