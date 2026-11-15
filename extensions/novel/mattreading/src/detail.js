// detail.js — Thong tin 1 truyen (execute(url) -> doi tuong truyen).
//
// Trang truyen la WordPress page (kiem chung live 2026-11-15):
// - Ten: h1.entry-title (fallback <title> bo duoi " – MattReading").
// - Anh bia: img dau tien trong div.entry-content (http:// doi ve https://).
// - Gioi thieu: <p> dau tien trong div.entry-content.
// - Trang thai: bang NOVELS (file helper.js) — Complete/Dropped -> false,
//   Ongoing/Hiatus -> true.
// - The loai: chuyen muc cua truyen (mo muc luc chuong moi nhat).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var novel = novelByUrl(url);
    if (!novel) return Response.error("Link truyện không hợp lệ.");
    var detailUrl = absUrl(novel.url);
    var r = fetchMrDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var t = doc.select("title").first();
        if (t !== null) name = cleanText(t.text()).replace(/ – MattReading$/, "").replace(/ - MattReading$/, "");
    }
    if (!name) name = novel.title;

    var cover = novel.cover;
    var ec = safeFirst(doc.select("div.entry-content"));
    var description = "";
    if (ec !== null) {
        var img = safeFirst(ec.select("img"));
        if (img !== null) {
            var src = img.attr("src") || "";
            if (src) cover = fixCover(src);
        }
        var p0 = safeFirst(ec.select("p"));
        if (p0 !== null) description = cleanText(p0.text());
    }

    var ongoing = (novel.status === "Ongoing" || novel.status === "Hiatus");
    var detail = "Trạng thái: " + novel.status;
    var genres = [{
        title: novel.title,
        input: "/category/" + novel.category + "/",
        script: "gen.js"
    }];

    return Response.success({
        name: name,
        author: "MattReading",
        cover: cover,
        description: description,
        detail: detail,
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
