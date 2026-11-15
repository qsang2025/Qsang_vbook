// detail.js — thong tin chi tiet mot truyen (piaotia.com).
//
// Selector that (kiem chung live 2026-11-15 voi 傲世九重天):
// - Ten: #centerm h1.
// - Bang thong tin trong #centerm (#content): cac <td> chua
//   "类 别：玄幻魔法", "作 者：风凌天下", "全文长度：11698488字",
//   "最后更新：2020-05-04", "文章状态：已完成".
// - Bia: img trong td 80% (/files/article/image/<cat>/<id>/<id>s.jpg),
//   fallback suy ra tu URL chi tiet.
// - Mo ta: phan sau "内容简介：" trong td 80%.
// - The loai: 1 muc tro ve gen.js theo so sort.
// - Trang thai "已完成"/"完本" -> ongoing=false, con lai true.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
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
    url = String(url || "");
    if (url.charAt(0) === "/") url = siteOrigin() + url;
    url = normalizeUrl(url);
    var r = fetchPtDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select("#centerm h1"));
    var name = nameEl === null ? "" : cleanText(nameEl.text());
    if (!name) {
        var titleEl = safeFirst(doc.select("title"));
        if (titleEl !== null) {
            name = cleanText(titleEl.text()).split(",")[0].replace(/最新章节$/, "");
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    // Bang thong tin: quet cac <td> la trong #centerm, BO QUA td chua bang
    // long ben trong (td bao ngoai chua ca bang se gop het cac dong lai,
    // regex tham lam se lay ca khoi chu — chi lay td la khong chua <table>).
    var category = "";
    var author = "";
    var status = "";
    var length = "";
    var updated = "";
    var tds = doc.select("#centerm td");
    var i = 0;
    for (i = 0; i < tds.size(); i++) {
        if (tds.get(i).select("table").size() > 0) continue;
        var t = cleanText(tds.get(i).text());
        var m = null;
        if (!category && (m = t.match(/类\s*别：(.+)$/))) category = cleanText(m[1]);
        else if (!author && (m = t.match(/作\s*者：(.+)$/))) author = cleanText(m[1]);
        else if (!status && (m = t.match(/文章状态：(.+)$/))) status = cleanText(m[1]);
        else if (!length && (m = t.match(/全文长度：(.+)$/))) length = cleanText(m[1]);
        else if (!updated && (m = t.match(/最后更新：(.+)$/))) updated = cleanText(m[1]);
    }

    // Bia: img trong td 80%, fallback suy ra tu URL.
    var cover = "";
    var imgEl = safeFirst(doc.select("#centerm td[width='80%'] img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src"));
    if (!cover) cover = coverFromBookUrl(url);

    // Mo ta: phan sau "内容简介：" trong td 80%.
    var description = "";
    var descTd = safeFirst(doc.select("#centerm td[width='80%']"));
    if (descTd !== null) {
        var full = cleanText(descTd.text());
        var idx = full.indexOf("内容简介：");
        if (idx !== -1) description = cleanText(full.substring(idx + "内容简介：".length));
        if (!description) description = full;
    }

    var detail = "";
    if (author) detail += "作者: " + author + "<br>";
    if (category) detail += "类别: " + category + "<br>";
    if (status) detail += "状态: " + status + "<br>";
    if (length) detail += "全文长度: " + length + "<br>";
    if (updated) detail += "最后更新: " + updated;
    detail = detail.replace(/<br>$/, "");

    var genres = [];
    if (category && CATEGORY_MAP[category]) {
        genres.push({ title: category, input: "/booksort" + CATEGORY_MAP[category] + "/0/1.html", script: "gen.js" });
    }

    var ongoing = true;
    if (status && (status.indexOf("已完成") !== -1 || status.indexOf("完本") !== -1 || status.indexOf("完结") !== -1)) {
        ongoing = false;
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url.replace(/\/+$/, ""),
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        host: siteOrigin()
    });
}
