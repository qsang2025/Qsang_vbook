// detail.js — thong tin chi tiet mot truyen cua 乐文小说.
// URL mau: https://www.ilwxs.com/info-41361.html (truyen 嫡嫁千金,
// tac gia 千山茶客, the loai 玄幻魔法, trang thai 连载中).
// Selector that (kiem chung live 2026-11-15):
//   ten + tac gia: h1.f21h (ten) / h1.f21h em a (tac gia)
//   anh bia: .pic img (khong co the em boc ngoai)
//   gioi thieu: .intro
//   the loai / trang thai / so chu / cap nhat: .infotop td
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

// The loai tren trang chi tiet -> input cua gen.js (khop genre.js).
var GENRE_INPUTS = {
    "玄幻魔法": "/leibie1_",
    "武侠修真": "/leibie2_",
    "都市言情": "/leibie3_",
    "历史军事": "/leibie4_",
    "侦探推理": "/leibie5_",
    "网游动漫": "/leibie6_",
    "科幻小说": "/leibie7_",
    "恐怖灵异": "/leibie8_",
    "散文诗词": "/leibie9_",
    "其他类型": "/leibie10_"
};

function execute(url) {
    url = normalizeUrl(url);
    var res = fetchPage(url);
    if (!res.ok) return Response.error("Không tải được trang truyện (HTTP " + res.status + ")");
    var doc = res.html();

    var h1El = safeFirst(doc.select("h1.f21h"));
    var author = "";
    var authorEl = h1El ? safeFirst(h1El.select("em a")) : null;
    if (authorEl) author = cleanText(authorEl.text());
    var name = h1El ? cleanText(h1El.text()) : "";
    if (author && name.indexOf("作者:" + author) !== -1) {
        name = name.replace("作者:" + author, "");
    }
    name = cleanText(name);

    var cover = "";
    var coverEl = safeFirst(doc.select(".pic img"));
    if (coverEl) cover = coverEl.attr("src") || "";
    var description = cleanText(doc.select(".intro").text());

    // Bang thong tin: the loai, trang thai, so chu, cap nhat.
    var infoParts = [];
    var infoTds = doc.select(".infotop td");
    var i = 0;
    for (i = 0; i < infoTds.size(); i++) {
        var t = cleanText(infoTds.get(i).text());
        if (t) infoParts.push(t);
    }
    var detail = infoParts.join("<br>");
    var infoText = infoParts.join(" ");

    var category = "";
    var cm = infoText.match(/小说分类：\s*(\S+)/);
    if (cm) category = cm[1];
    var statusText = "";
    var sm = infoText.match(/小说状态：\s*(\S+)/);
    if (sm) statusText = sm[1];
    var ongoing = statusText.indexOf("完结") === -1 && statusText.indexOf("已完本") === -1;

    var genres = [];
    if (category && GENRE_INPUTS[category]) {
        genres.push({ title: category, input: GENRE_INPUTS[category], script: "gen.js" });
    }

    if (!name) return Response.error("Không đọc được tên truyện (site có thể đã đổi giao diện): " + url);
    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres
    });
}
