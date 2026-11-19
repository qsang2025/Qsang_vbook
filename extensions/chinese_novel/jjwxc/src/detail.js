// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang truyen onebook.php?novelid=<id> (kiem chung live 2026-11-19
// voi 砸锅卖铁去上学 novelid 4737103):
// - Ten: h1 (span itemprop articleSection); fallback <title> dang
//   "《Ten》Tac gia_晋江文学城_...".
// - Tac gia: [itemprop="author"]. Mo ta: [itemprop="description"].
// - Trang thai: "文章进度：完结" => da xong, "连载中" => dang ra.
// - The loai: "文章类型：原创-言情-幻想未来-爱情" -> tach theo "-",
//   doi ten (言情/纯爱/百合/无CP/多元) thanh link bookbase.php.
// - So chuong: dem dong tr[itemprop*="chapter"] tren cung trang,
//   tach mien phi / VIP (sach mau: 338 tong, 15 mien phi, 323 VIP).
// - KHONG co anh bia tren trang truyen (bia chi tai qua JS) nen
//   cover de trong.
//
// Tai len: file config.js, file config-helpers.js, file
// fetch-helpers.js, file rate-limit.js, file safe-first.js, file
// gbk.js, file cleanHtml.js, file helper.js.
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
    var storyUrl = normalizeStoryUrl(String(url || ""));
    if (!novelIdFromUrl(storyUrl)) {
        return Response.error("Đường dẫn truyện không hợp lệ: " + String(url || ""));
    }
    var r = fetchJjDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1; fallback <title> "《Ten》...".
    var name = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanText(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            var tm = /《([^》]+)》/.exec(String(titleTag.text()));
            if (tm) name = cleanText(tm[1]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Tac gia + mo ta theo itemprop.
    var author = "";
    var authorEl = safeFirst(doc.select('[itemprop="author"]'));
    if (authorEl !== null) author = cleanText(authorEl.text());
    var description = "";
    var descEl = safeFirst(doc.select('[itemprop="description"]'));
    if (descEl !== null) description = cleanText(descEl.text());

    // Trang thai + the loai tu text than trang.
    var bodyText = "";
    try {
        bodyText = String(doc.select("body").text() || "");
    } catch (e) {
        bodyText = "";
    }
    var ongoing = true;
    var statusText = "";
    var sm = /文章进度[:：]\s*([^\s┃]+)/.exec(bodyText);
    if (sm) {
        statusText = sm[1];
        if (statusText.indexOf("完结") !== -1 || statusText.indexOf("已完成") !== -1) {
            ongoing = false;
        }
    }
    var typeText = "";
    var ym = /文章类型[:：]\s*([^\s┃]+)/.exec(bodyText);
    if (ym) typeText = ym[1];

    var genres = [];
    var suggests = [];
    if (typeText) {
        var parts = typeText.split("-");
        var i = 0;
        for (i = 0; i < parts.length; i++) {
            var cat = categoryByTitle(cleanText(parts[i]));
            if (cat !== null) {
                genres.push({ title: cat.title, input: cat.input, script: "gen.js" });
                if (suggests.length === 0) {
                    suggests.push({ title: "Cùng thể loại", input: cat.input, script: "gen.js" });
                }
            }
        }
    }

    // So chuong (tong / mien phi / VIP) dem tren cung trang.
    var counts = countChapters(doc);
    var detail = "";
    if (typeText) detail = "文章类型：" + typeText;
    if (statusText) detail = detail ? detail + " ┃ 文章进度：" + statusText : "文章进度：" + statusText;
    if (counts.total > 0) {
        var chapInfo = "Số chương: " + counts.total + " (miễn phí: " + counts.free + ", VIP: " + counts.vip + ")";
        detail = detail ? detail + " ┃ " + chapInfo : chapInfo;
    }

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: description,
        detail: detail,
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
