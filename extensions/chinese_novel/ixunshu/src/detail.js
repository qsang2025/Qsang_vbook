// detail.js — Chi tiet truyen (execute(url) -> novel).
//
// Trang /xs/<id> (kiem chung live 2026-11-16):
// - Ten: #info h1; tac gia: #info > p dau tien (bo tien to 作者：).
// - Trang thai / chuong moi / cap nhat: cac p con lai trong #info.
// - Tom tat: meta description (cat bo mo dau boilerplate, xem
//   cleanMetaDesc trong file helper.js). #intro tren trang chi tiet
//   chi la dong boilerplate nen khong dung.
// - Bia: #fmimg img luon la /static/default/img/nocover.jpg — khong
//   co bia that nen khong tra cover.
// - The loai: breadcrumb .con_top (bo 首页）, link /aggregation/<id>.
// - Trang thai 连载 -> ongoing=true; 完结/完成 -> ongoing=false.
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
    var target = normalizeIxUrl(url);
    if (!target) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchIxDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var info = doc.select("#info");
    if (info === null || info.size() === 0) {
        return Response.error("Không đọc được trang chi tiết.");
    }
    var h1 = safeFirst(info.select("h1"));
    var name = h1 !== null ? cleanText(h1.text()) : "";
    if (!name) return Response.error("Không đọc được tên truyện.");
    var detailParts = [];
    var author = "";
    var ongoing = true;
    var ps = info.select("p");
    for (var i = 0; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (!t) continue;
        detailParts.push(t);
        if (i === 0 && t.indexOf("作者：") === 0) {
            author = cleanText(t.substring("作者：".length));
        }
        if (t.indexOf("完结") !== -1 || t.indexOf("完成") !== -1) ongoing = false;
    }
    var desc = "";
    var md = safeFirst(doc.select("meta[name=\"description\"]"));
    if (md !== null) desc = cleanMetaDesc(md.attr("content") || "");
    var genres = [];
    var crumbs = doc.select(".con_top a");
    for (var j = 0; j < crumbs.size(); j++) {
        var a = crumbs.get(j);
        var gt = cleanText(a.text());
        var gh = String(a.attr("href") || "");
        if (!gt || gt === "首页") continue;
        if (gh.indexOf("/aggregation/") === -1) continue;
        genres.push({ title: gt, input: absUrl(gh), script: "gen.js" });
    }
    return Response.success({
        name: name,
        author: author,
        description: desc,
        detail: detailParts.join("<br>"),
        url: target,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
