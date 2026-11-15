// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /<the loai>/<id>.html (kiem chung live 2026-11-15):
// - h1 trong div.infos = ten + hau to "(全本)" (da xong) hoac "(1-279)"
//   (so chuong da cu) -> cat hau to; "(全本)" => ongoing=false.
// - Bia: div.book_info.clearfix > div.pic > img (/d/file/...).
// - Tac gia: div.date span a; thoi gian cap nhat trong div.date.
// - Mo ta: <p> ngay sau div.booktips.
// - The loai: suy ra tu tien to duong dan (/book/ -> 精品小說...).
// - Muc luc nam ngay tren trang chi tiet (toc.js quet div.book_list).
// - Khong co khoa VIP / dang nhap / preview.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var storyUrl = String(url || "");
    if (storyUrl.charAt(0) === "/") storyUrl = siteOrigin() + storyUrl;
    storyUrl = normalizeUrl(storyUrl);
    var r = fetchJxDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1 (cat hau to "(全本)" / "(1-279)"); fallback <title>.
    var name = "";
    var h1 = safeFirst(doc.select("div.infos > h1"));
    if (h1 !== null) name = cleanBookName(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            name = cleanBookName(String(titleTag.text()).split("_")[0]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Bia: div.pic img; fallback og:image.
    var cover = "";
    var picEl = safeFirst(doc.select("div.book_info.clearfix > div.pic > img"));
    if (picEl !== null) cover = absUrl(picEl.attr("src")) || "";
    if (!cover) {
        var metaOg = safeFirst(doc.select("meta[property='og:image']"));
        if (metaOg !== null) cover = absUrl(metaOg.attr("content")) || "";
    }

    // Tac gia + thoi gian trong div.date.
    var author = "";
    var detail = "";
    var dateEl = safeFirst(doc.select("div.date"));
    if (dateEl !== null) {
        detail = cleanText(dateEl.text());
        var authorEl = safeFirst(dateEl.select("span > a"));
        if (authorEl !== null) author = cleanText(authorEl.text());
    }

    // Mo ta: <p> ngay sau div.booktips; fallback meta description.
    var description = "";
    var descEl = safeFirst(doc.select("div.booktips + p"));
    if (descEl !== null) description = cleanText(stripTags(descEl.html()));
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc !== null) description = cleanText(metaDesc.attr("content"));
    }

    // Trang thai: "(全本)" / "完本" / "已完结" trong h1 => da xong.
    var ongoing = true;
    var rawH1 = h1 !== null ? h1.text() : "";
    if (rawH1.indexOf("(全本)") !== -1 || rawH1.indexOf("完本") !== -1 || rawH1.indexOf("已完结") !== -1) {
        ongoing = false;
    }

    // The loai theo tien to duong dan.
    var genres = [];
    var cat = categoryFromUrl(storyUrl);
    if (cat !== null) {
        genres.push({ title: cat.title, input: cat.input, script: "gen.js" });
    }

    var suggests = [];
    if (cat !== null) {
        suggests.push({ title: "Cùng thể loại", input: cat.input, script: "gen.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: storyUrl.replace(/\/+$/, ""),
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
