// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang chi tiet /<cat>/<id>.html (kiem chung live 2026-11-16, sach mau
// 27772 据说我是神仙下凡):
// - Ten: h1 (trim). Tac gia: .tbtls a[href*=show=writer]; ngay dang:
//   span "时间：YYYY-MM-DD" trong .tbtls.
// - The loai (category): link cuoi trong span chua "当前位置" (breadcrumb).
// - Tag: a[href*=/tags-] trong .tbtls (sach mau co 7 tag).
// - Mo ta: meta[name=description].
// - KHONG co anh bia (chi co logo /img/logo.png) — cover "" (tien le
//   sjks88/powanjuan/qbtr). KHONG co trang thai hoan/thieu tren trang chi
//   tiet — ongoing mac dinh true.
// - Suggests: 2 nhom div.tuijian_box — "推荐文章" (8 sach) + "作者部分作品"
//   (tru sach dang xem); moi muc {title, input, script: "detail.js"}.
// - Link tac gia tren trang chi tiet la URL tim kiem GET
//   (/e/search/?searchget=1&keyboard=<ten>&show=writer) — KHONG dua vao
//   genres (gen.js khong doc duoc URL tim kiem); tac gia nam o truong
//   author.
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
    url = normalizeFxUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchFxDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select("h1"));
    var name = nameEl !== null ? cleanText(nameEl.text()) : "";
    if (!name) {
        var ti = String(doc.select("title").text() || "");
        name = cleanText(ti.split("-")[0].split("_")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    var author = "";
    var dateText = "";
    var tags = [];
    var tbtls = safeFirst(doc.select("div.tbtls"));
    if (tbtls !== null) {
        var auEl = safeFirst(tbtls.select("a[href*=\"show=writer\"]"));
        if (auEl !== null) author = cleanText(auEl.text());
        var tt = cleanText(tbtls.text());
        var dm = tt.match(/时间：\s*([0-9-]+)/);
        if (dm) dateText = dm[1];
        if (!author) {
            var am = tt.match(/作者：\s*([^\s]+)/);
            if (am) author = cleanText(am[1]);
        }
        var tagLinks = tbtls.select("a[href*=\"/tags-\"]");
        var seenTag = {};
        for (var i = 0; i < tagLinks.size(); i++) {
            var ta = tagLinks.get(i);
            var tTitle = cleanText(ta.text());
            var tHref = String(ta.attr("href") || "");
            if (!tTitle || !tHref) continue;
            var tLink = absUrl(tHref);
            if (seenTag[tLink]) continue;
            seenTag[tLink] = 1;
            tags.push(tTitle);
        }
    }

    var description = "";
    var metaEl = safeFirst(doc.select("meta[name=\"description\"]"));
    if (metaEl !== null) description = cleanText(metaEl.attr("content"));
    if (!description && tbtls !== null) description = cleanText(tbtls.text());

    // The loai: category tu breadcrumb + cac tag (mo qua gen.js).
    var genres = [];
    var spans = doc.select("span");
    for (var s = 0; s < spans.size(); s++) {
        var sp = spans.get(s);
        if (String(sp.text() || "").indexOf("当前位置") === -1) continue;
        var cLinks = sp.select("a");
        if (cLinks.size() > 0) {
            var cLast = cLinks.get(cLinks.size() - 1);
            var cTitle = cleanText(cLast.text());
            var cHref = String(cLast.attr("href") || "");
            if (cTitle && cTitle !== "首页" && cHref) {
                genres.push({ title: cTitle, input: absUrl(cHref), script: "gen.js" });
            }
        }
        break;
    }
    var tagAs = doc.select("a[href*=\"/tags-\"]");
    var seenGenre = {};
    for (var g = 0; g < tagAs.size(); g++) {
        var ga = tagAs.get(g);
        var gTitle = cleanText(ga.text());
        var gHref = String(ga.attr("href") || "");
        if (!gTitle || !gHref) continue;
        var gLink = absUrl(gHref);
        if (seenGenre[gLink]) continue;
        seenGenre[gLink] = 1;
        genres.push({ title: gTitle, input: gLink, script: "gen.js" });
    }

    // Suggests: 2 nhom div.tuijian_box (推荐文章 + 作者部分作品), tru
    // sach dang xem. Base Moleys v7 tim h4 chua "推荐" — trang that dung
    // h3 trong div.tuijian_box nen doc theo cau truc that nay.
    var suggests = [];
    var seenSug = {};
    var boxes = doc.select("div.tuijian_box");
    for (var b = 0; b < boxes.size(); b++) {
        var links = boxes.get(b).select("p a");
        for (var k = 0; k < links.size(); k++) {
            var la = links.get(k);
            var lTitle = cleanText(la.text());
            var lHref = String(la.attr("href") || "");
            if (!lTitle || !lHref) continue;
            var lLink = absUrl(lHref);
            if (lLink === url) continue;
            var lm = lLink.match(/\/[a-z]+\/\d+\.html$/);
            if (!lm) continue;
            if (seenSug[lLink]) continue;
            seenSug[lLink] = 1;
            suggests.push({ title: lTitle, input: lLink, script: "detail.js" });
        }
    }

    var detailParts = [];
    if (author) detailParts.push("作者：" + author);
    if (dateText) detailParts.push("时间：" + dateText);
    if (tags.length > 0) detailParts.push("标签：" + tags.join("，"));

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: description,
        detail: detailParts.join(" | "),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: true,
        genres: genres,
        suggests: suggests
    });
}
