// detail.js — Thong tin chi tiet mot truyen (execute(url) -> detail).
//
// Trang truyen /<id>/ (kiem chung live 2026-11-16 voi 欢迎进入梦魇直播间
// /104461/ va 关于系统总发布奇葩任务这件事 /345057/):
// - Ten: #info h1. Tac gia: #info p "作者：" + link /author/<ten>/.
// - Trang thai: #info "状态：连载" (ongoing=true) / "完结" (false).
// - Anh bia: #fmimg img — data-original moi la anh that (src la
//   nocover.jpg giu cho).
// - Mo ta: #intro; cuoi mo ta co cau mau "《X》是作者精心创作的<the loai>。"
//   (cat bo) va chinh cau nay cho biet the loai de gan genres.
// - detail: tac gia / trang thai / so chu / chuong moi nhat / cap nhat cuoi.
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
    storyUrl = normalizeUrl(storyUrl);
    // App cat dau "/" cuoi cua URL khi chay that; trang chi tiet can dau "/".
    if (/\/\d+$/.test(storyUrl)) storyUrl = storyUrl + "/";
    var r = fetchSkDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var infoEl = safeFirst(doc.select("#info"));
    if (infoEl === null) {
        return Response.error("Không đọc được trang truyện: " + storyUrl);
    }
    var name = cleanText(safeFirst(doc.select("#info h1")) !== null ? safeFirst(doc.select("#info h1")).text() : "");
    if (!name) name = cleanText(doc.select("meta[property=\"og:title\"]").attr("content"));
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    var author = "";
    var ps = infoEl.select("p");
    var i = 0;
    for (i = 0; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (t.indexOf("作者：") === 0) {
            var aEl = safeFirst(ps.get(i).select("a"));
            author = aEl !== null ? cleanText(aEl.text()) : t.replace(/^作者：/, "");
            break;
        }
    }

    var infoText = cleanText(infoEl.text());
    var statusM = infoText.match(/状态：(\S+)/);
    var status = statusM ? statusM[1] : "";
    var ongoing = status.indexOf("连载") !== -1;
    var wordsM = infoText.match(/字数：([^|]+)/);
    var words = wordsM ? cleanText(wordsM[1]) : "";
    var latestM = infoText.match(/最新章节：(.+?)(最后更新：|$)/);
    var latest = latestM ? cleanText(latestM[1]) : "";
    var updatedM = infoText.match(/最后更新：(\S+ \S+)/);
    var updated = updatedM ? updatedM[1] : "";

    var cover = realCover(safeFirst(doc.select("#fmimg img")));

    var introEl = safeFirst(doc.select("#intro"));
    var description = introEl !== null ? cleanText(introEl.text()) : "";
    // Cat cau mau cuoi mo ta: "《X》是作者精心创作的<the loai>。"
    var genreName = "";
    var gm = description.match(/《[^》]+》是.+精心创作的([^。]+)。\s*$/);
    if (gm) {
        genreName = cleanText(gm[1]);
        description = cleanText(description.replace(/《[^》]+》是.+精心创作的[^。]+。\s*$/, ""));
    }

    var genres = [];
    if (genreName) {
        var gpath = genrePathByName(genreName);
        if (gpath) genres.push({ title: genreName, input: gpath, script: "gen.js" });
    }

    var detail = "作者：" + author;
    if (status) detail += "<br>状态：" + status;
    if (words) detail += "<br>字数：" + words;
    if (latest) detail += "<br>最新章节：" + latest;
    if (updated) detail += "<br>最后更新：" + updated;

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
        suggests: []
    });
}
