// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /tongren/<id>.html (kiem chung live 2026-11-16 voi
// 人在箱庭，是纯血龙种 /tongren/10307.html):
// - h1 ten + hau to "(全本)" (da xong) hoac "(1-1355)" (dang ra)
//   -> cat hau to; "(全本)" => ongoing=false.
// - Anh bia div.pic img (/d/file/...).
// - Tac gia div.infos div.date span a; mo ta div.infos p.
// - The loai: moi truyen tren site deu la dong nhan -> 同人小说.
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
    var r = fetchTrDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1 (cat hau to "(全本)" / "(1-1355)"); fallback <title>.
    var name = "";
    var h1 = safeFirst(doc.select("div.infos h1"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanBookName(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            name = cleanBookName(String(titleTag.text()).split("_")[0]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Anh bia: div.pic img.
    var cover = "";
    var imgEl = safeFirst(doc.select("div.pic img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src"));

    // Tac gia: div.infos div.date span a.
    var author = "";
    var authorEl = safeFirst(doc.select("div.infos div.date span a"));
    if (authorEl !== null) author = cleanText(authorEl.text());

    // Mo ta: div.infos p.
    var description = "";
    var descEl = safeFirst(doc.select("div.infos p"));
    if (descEl !== null) description = cleanText(stripTags(descEl.html()));
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc !== null) description = cleanText(metaDesc.attr("content"));
    }

    // Chi tiet phu: ngay + kich thuoc trong div.infos div.date.
    var detail = "";
    var dateEl = safeFirst(doc.select("div.infos div.date"));
    if (dateEl !== null) detail = cleanText(dateEl.text());

    // Trang thai: "(全本)" / "完本" / "已完结" trong h1 => da xong.
    var ongoing = true;
    var rawH1 = h1 !== null ? h1.text() : "";
    if (rawH1.indexOf("(全本)") !== -1 || rawH1.indexOf("完本") !== -1 || rawH1.indexOf("已完结") !== -1) {
        ongoing = false;
    }

    // The loai: tat ca truyen tren site deu la dong nhan.
    var genres = [{ title: "同人小说", input: "/tongren/", script: "gen.js" }];
    var suggests = [{ title: "Cùng thể loại", input: "/tongren/", script: "gen.js" }];

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
