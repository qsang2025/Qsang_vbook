// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /<the loai>/<id>.html (kiem chung live 2026-11-15 voi
// 吞噬星空之主宰 /cyjk/19634.html):
// - h1 ten + hau to "(1-1440)" (so chuong da cu) hoac "(全本)" (da xong)
//   -> cat hau to; "(全本)" => ongoing=false.
// - KHONG co anh bia tren trang chi tiet (khong co .cover, khong co anh
//   /d/file/ nao) nen cover de trong; chi khoi 推荐小说 tren trang chu
//   moi co anh bia.
// - Tac gia: .descTip p.author span ("作者：..."); kich thuoc + ngay
//   trong .descTip.
// - Mo ta: .descInfo p (nam trong dau ngoac kep) -> bo dau ngoac kep
//   o hai dau.
// - The loai: suy ra tu tien to duong dan (/cyjk/ -> 穿越架空).
// - Muc luc nam ngay tren trang chi tiet (toc.js quet ul.clearfix).
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
    var storyUrl = normalizeStoryUrl(String(url || ""));
    if (storyUrl.charAt(0) === "/") storyUrl = siteOrigin() + storyUrl;
    storyUrl = normalizeUrl(storyUrl);
    var r = fetchFfDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1 (cat hau to "(全本)" / "(1-1440)"); fallback <title>.
    var name = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanBookName(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            name = cleanBookName(String(titleTag.text()).split("_")[0]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Tac gia + kich thuoc + ngay trong .descTip.
    var author = "";
    var detail = "";
    var tipEl = safeFirst(doc.select("div.descTip"));
    if (tipEl !== null) {
        var authorEl = safeFirst(tipEl.select("p.author span"));
        if (authorEl !== null) author = cleanText(authorEl.text()).replace(/^作者[:：]\s*/, "");
        detail = cleanText(tipEl.text());
    }

    // Mo ta: .descInfo p; bo dau ngoac kep o hai dau neu co.
    var description = "";
    var descEl = safeFirst(doc.select("div.descInfo p"));
    if (descEl !== null) description = cleanText(stripTags(descEl.html()));
    if (description.length >= 2 && description.charAt(0) === '"' && description.charAt(description.length - 1) === '"') {
        description = description.substring(1, description.length - 1);
    }
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc !== null) description = cleanText(metaDesc.attr("content"));
    }

    // Trang thai: "(全本)" / "完本" / "已完结" trong h1 => da xong.
    var ongoing = true;
    var rawH1 = h1 !== null ? h1.text() : "";
    if (rawH1.indexOf("(全本)") !== -1 || rawH1.indexOf("完本") !== -1 || rawH1.indexOf("已完结") !== -1) {
        ongoing = false;
    }

    // The loai theo tien to duong dan.
    var genres = [];
    var cat = categoryFromUrl(storyUrl);
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
        cover: "",
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
