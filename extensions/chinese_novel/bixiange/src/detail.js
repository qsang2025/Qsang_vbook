// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /{cat}/{id}/ (kiem chung live 2026-11-14):
// - h1 = ten + hau to "(1-537)" (so chuong da cu) -> cat hau to.
// - Bia: .info-left .cover img (alt = ten sach).
// - .descTip span: "分类：X", "作者：X", "时间：..." .
// - Mo ta: .descInfo p (day du); fallback meta[name=description].
// - Trang KHONG co marker trang thai (连载/完结/全本) -> ongoing mac dinh
//   true (uoc luong, ghi ro o day).
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

function execute(url) {
    var storyUrl = resolveUrl(url);
    var r = fetchBxDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1 (cat hau to "(1-537)"); fallback <title>.
    var name = "";
    var h1 = safeFirst(doc.select(".desc h1, h1"));
    if (h1) name = cleanBookName(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag) name = cleanBookName(String(titleTag.text()).split("|")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    // Bia: .info-left .cover img; fallback og:image.
    var cover = "";
    var picEl = safeFirst(doc.select(".info-left .cover img, .cover img"));
    if (picEl) cover = cleanText(picEl.attr("data-src") || picEl.attr("src"));
    if (!cover) {
        var metaOg = safeFirst(doc.select("meta[property='og:image']"));
        if (metaOg) cover = cleanText(metaOg.attr("content"));
    }
    if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;

    // Tac gia + the loai tu .descTip span.
    var author = "";
    var catSlug = "";
    var catName = "";
    var tips = doc.select(".descTip span");
    for (var i = 0; i < tips.size(); i++) {
        var t = cleanText(tips.get(i).text());
        if (t.indexOf("作者") === 0) author = cleanText(t.replace(/^作者[：:]\s*/, ""));
        if (t.indexOf("分类") === 0) catName = cleanText(t.replace(/^分类[：:]\s*/, ""));
    }
    var catM = /\/(dsyq|wxxz|xhqh|cyjk|khjj|ghxy|jsls|guanchang|xtfq|dmtr|trxs|jqxs)\//.exec(storyUrl);
    if (catM) {
        catSlug = catM[1];
        if (!catName) catName = GENRE_MAP[catSlug] || catSlug;
    }

    // Mo ta: .descInfo p; fallback meta description.
    var description = "";
    var descEl = safeFirst(doc.select(".descInfo p, .descInfo"));
    if (descEl) description = stripHtml(descEl.html());
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc) description = cleanText(metaDesc.attr("content"));
    }

    var genres = [];
    if (catSlug) genres.push({ title: catName, input: catSlug, script: "gen.js" });
    var suggests = [{ title: "Cùng thể loại", input: storyUrl, script: "suggest.js" }];

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: catName ? "分类：" + catName : "",
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: true,
        genres: genres,
        suggests: suggests
    });
}
