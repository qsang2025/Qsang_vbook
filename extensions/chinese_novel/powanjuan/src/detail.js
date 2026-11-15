// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /<the loai>/<id> (kiem chung live 2026-11-16 voi
// 无限之次元征服 /tongren/13276 va 这个学霸过于自律 /khjj/20240.html):
// - h1 ten + hau to "(1-99)" (so chuong da cu) hoac "(全本)" (da xong)
//   -> cat hau to; "(全本)" => ongoing=false. Hau to co the da cu
//   (sach 2 ghi (1-480) nhung muc luc that co 721 chuong) — khong
//   dung h1 de dem chuong.
// - KHONG co anh bia tren trang chi tiet (chi co logo site) nen cover
//   de trong.
// - Tac gia: .descTip p dau tien ("作者：..."); thoi gian: p thu 2.
// - Mo ta: .descInfo p (co <br /> ngat dong).
// - The loai: suy ra tu tien to duong dan (/tongren/ -> 同人小说).
// - Trang thai: mac dinh ongoing=true (site khong ghi trang thai);
//   chi false khi ten sach chua (全本)/完本/已完结 hoac muc luc co
//   chuong 完本感言/大结局/后记/全书完.
// - Muc luc nam ngay tren trang chi tiet (toc.js quet div.catalog).
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
    var storyUrl = String(url || "");
    if (storyUrl.charAt(0) === "/") storyUrl = siteOrigin() + storyUrl;
    storyUrl = normalizeStoryUrl(normalizeUrl(storyUrl));
    var r = fetchPwDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1 trong .desc (cat hau to "(全本)" / "(1-99)").
    var name = "";
    var h1 = safeFirst(doc.select(".desc h1"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanBookName(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            name = cleanBookName(String(titleTag.text()).split(",")[0]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Tac gia + thoi gian: .descTip p (span "作者：..." / "时间：...").
    var author = "";
    var detail = "";
    var infos = doc.select(".descTip p");
    var i = 0;
    var infoParts = [];
    for (i = 0; i < infos.size(); i++) {
        var t = cleanText(infos.get(i).text());
        if (!t) continue;
        infoParts.push(t);
        if (t.indexOf("作者") === 0) author = t.replace(/^作者[:：]\s*/, "");
    }
    detail = infoParts.join(" | ");

    // Mo ta: .descInfo p.
    var description = "";
    var descEl = safeFirst(doc.select(".descInfo p"));
    if (descEl !== null) description = cleanText(stripTags(descEl.html()));
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc !== null) description = cleanText(metaDesc.attr("content"));
    }

    // Trang thai: "(全本)" / "完本" / "已完结" trong h1 => da xong;
    // hoac muc luc co chuong ket (完本感言/大结局/后记/全书完).
    var ongoing = true;
    var rawH1 = h1 !== null ? h1.text() : "";
    if (rawH1.indexOf("(全本)") !== -1 || rawH1.indexOf("完本") !== -1 || rawH1.indexOf("已完结") !== -1) {
        ongoing = false;
    } else {
        var tocLinks = doc.select("div.catalog li a");
        for (i = 0; i < tocLinks.size(); i++) {
            var cn = cleanText(tocLinks.get(i).text());
            if (cn.indexOf("完本感言") !== -1 || cn.indexOf("大结局") !== -1 || cn.indexOf("后记") !== -1 || cn.indexOf("全书完") !== -1) {
                ongoing = false;
                break;
            }
        }
    }

    // The loai theo tien to duong dan.
    var genres = [];
    var cat = categoryFromUrl(storyUrl);
    if (cat !== null) {
        genres.push({ title: cat.title, input: cat.input, script: "zen.js" });
    }

    var suggests = [];
    if (cat !== null) {
        suggests.push({ title: "Cùng thể loại", input: cat.input, script: "zen.js" });
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
