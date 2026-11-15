// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /txt/<id>.html (kiem chung live 2026-11-16 voi
// 他怎么又不是人了？ /txt/60801.html va 全世界众筹复活本反派
// /txt/60720.html):
// - Ten: article.panel h3 《ten》 (cat 《》); du phong <title>.
// - Anh bia: .body.detail .pic img (anh avatar that /d/file/avator/...).
// - Tac gia / the loai / kich co / tien do / ngay dang: .kv p
//   (书籍作者：<a> / 书籍分类： / 书籍大小： / 写作进度：<span class="sfwj">
//   / 上传时间： / 下载方式：).
// - Mo ta: panel 内容简介 .desc — co the <style> o dau, go truoc khi
//   lay text; du phong meta description.
// - Trang thai: 写作进度 chua 连载 => ongoing=true; chua 完结/完本/
//   番外完/全本 => ongoing=false; mac dinh true.
// - The loai: breadcrumb nav.bd-crumb (link /txt/<cat>/) hoac chu
//   书籍分类： trong .kv.
// - Muc luc nam tren trang /read/<id>/ (toc.js suy tu URL chi tiet).
// - Khong co khoa VIP / dang nhap / preview.
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
    var storyUrl = String(url || "");
    if (storyUrl.charAt(0) === "/") storyUrl = siteOrigin() + storyUrl;
    storyUrl = normalizeStoryUrl(normalizeUrl(storyUrl));
    var r = fetchIjDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: article.panel h3 (cat 《》).
    var name = "";
    var h3 = safeFirst(doc.select("article.panel h3"));
    if (h3 !== null) name = cleanBookName(h3.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            name = cleanBookName(String(titleTag.text()).split("txt下载")[0]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Anh bia: .body.detail .pic img.
    var cover = "";
    var picImg = safeFirst(doc.select(".body.detail .pic img"));
    if (picImg !== null) {
        var src = picImg.attr("src") || "";
        if (src && src.indexOf("notimg.gif") === -1) cover = absUrl(src) || "";
    }

    // .kv p: tac gia / the loai / kich co / tien do / ngay dang.
    var author = "";
    var catTitle = "";
    var statusText = "";
    var detail = "";
    var kvs = doc.select(".body.detail .kv p");
    var i = 0;
    var infoParts = [];
    for (i = 0; i < kvs.size(); i++) {
        var t = cleanText(kvs.get(i).text());
        if (!t) continue;
        infoParts.push(t);
        if (t.indexOf("书籍作者") === 0) {
            author = t.replace(/^书籍作者[:：]\s*/, "");
        } else if (t.indexOf("书籍分类") === 0) {
            catTitle = t.replace(/^书籍分类[:：]\s*/, "");
        } else if (t.indexOf("写作进度") === 0) {
            statusText = t.replace(/^写作进度[:：]\s*/, "");
        }
    }
    detail = infoParts.join(" | ");

    // Mo ta: panel 内容简介 .desc (go <style> o dau truoc khi lay text).
    var description = "";
    var descEl = safeFirst(doc.select(".desc"));
    if (descEl !== null) {
        descEl.select("style").remove();
        descEl.select("script").remove();
        description = cleanText(stripTags(descEl.html()));
    }
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc !== null) {
            var mc = cleanText(metaDesc.attr("content"));
            // Meta description dang "《ten》,作者：X，简介:..." — cat phan mo dau.
            var idx = mc.indexOf("简介:");
            if (idx !== -1) mc = mc.substring(idx + 3);
            description = mc;
        }
    }

    // Trang thai: 连载 => dang ra; 完结/完本/番外完/全本 => da xong.
    var ongoing = true;
    if (statusText.indexOf("连载") !== -1) {
        ongoing = true;
    } else if (statusText.indexOf("完结") !== -1 || statusText.indexOf("完本") !== -1 ||
               statusText.indexOf("番外完") !== -1 || statusText.indexOf("全本") !== -1) {
        ongoing = false;
    }

    // The loai: breadcrumb truoc, .kv sau.
    var genres = [];
    var cat = null;
    var crumbLinks = doc.select("nav.bd-crumb a");
    for (i = 0; i < crumbLinks.size(); i++) {
        var c = categoryFromUrl(crumbLinks.get(i).attr("href") || "");
        if (c !== null) { cat = c; break; }
    }
    if (cat === null && catTitle) cat = categoryByTitle(catTitle);
    if (cat === null) cat = categoryFromUrl(storyUrl);
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
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
