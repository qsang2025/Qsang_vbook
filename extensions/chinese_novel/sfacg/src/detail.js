// detail.js — Chi tiet sach (execute(url) -> doi tuong sach).
//
// Selector kiem chung live 2026-11-16 tren trang desktop:
// .summary-content .title .text (ten — co span tag "VIP" long ben
// trong, phai cat truoc khi lay text), .author-name span (tac gia),
// .summary-pic img (bia, host rs.sfacg.com), .introduce (mo ta),
// .count-detail .text-row span (loai / so chu / nhan khi / cap nhat),
// .tag-list .tag a (tag -> /stag/<id>/).
// ongoing = chua co "完结" trong count-detail.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeSfUrl(url);
    if (!url) return Response.error("Đường dẫn truyện trống.");
    if (url.charAt(url.length - 1) !== "/") url = url + "/";

    var r = fetchSfDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten: cat span tag "VIP" long trong .text truoc khi lay text.
    var name = "";
    var nameEl = safeFirst(doc.select(".summary-content .title .text"));
    if (nameEl === null) nameEl = safeFirst(doc.select(".summary-content h1.title"));
    if (nameEl === null) nameEl = safeFirst(doc.select(".book-title"));
    if (nameEl !== null) {
        var nameHtml = nameEl.html();
        var cut = nameHtml.indexOf("<span");
        if (cut !== -1) nameHtml = nameHtml.substring(0, cut);
        name = cleanText(stripTags(nameHtml));
    }
    if (!name) return Response.error("Không đọc được tên truyện (site có thể đã đổi giao diện).");

    var author = cleanText(doc.select(".author-name span").text());
    if (!author) author = cleanText(doc.select(".author-name").text());

    var cover = "";
    var coverEl = safeFirst(doc.select(".summary-pic img"));
    if (coverEl !== null) cover = absMediaUrl(coverEl.attr("src"));

    var desc = cleanText(doc.select(".introduce").text());
    // .introduce chua ca nut chuc nang (点击阅读/赞/收藏...) o cuoi — cat bo.
    var di = desc.indexOf("点击阅读");
    if (di !== -1) desc = desc.substring(0, di).trim();

    var detailLines = ["书名：" + name, "作者：" + (author ? author : "未知")];
    var countSpans = doc.select(".count-detail .text-row span");
    for (var i = 0; i < countSpans.size(); i++) {
        var t = cleanText(countSpans.get(i).text());
        if (t) detailLines.push(t);
    }

    var isFinished = doc.select(".count-detail").text().indexOf("完结") !== -1;

    var tags = [];
    var tagEls = doc.select(".tag-list .tag a");
    for (var j = 0; j < tagEls.size(); j++) {
        var el = tagEls.get(j);
        var tName = cleanText(el.select(".text").text());
        if (!tName) tName = cleanText(el.text());
        var tHref = el.attr("href");
        if (tName && tHref) {
            tags.push({ title: tName, input: absUrl(tHref), script: "gen.js" });
        }
    }

    var genres = [];
    if (tags.length > 0) {
        genres.push({ title: "Cùng thể loại", input: tags[0].input, script: "gen.js" });
    }

    var suggests = [];
    var authorClub = safeFirst(doc.select(".author-info a[href*='/Club/'], .count-info a[href*='/Club/']"));
    if (authorClub !== null) {
        suggests.push({ title: "Cùng tác giả", input: absUrl(authorClub.attr("href")), script: "gen.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detailLines.join("<br>"),
        url: url,
        host: siteOrigin(),
        type: "chinese_novel",
        format: "novel",
        ongoing: !isFinished,
        tags: tags,
        genres: genres,
        suggests: suggests,
        reviews: [],
        comments: []
    });
}
