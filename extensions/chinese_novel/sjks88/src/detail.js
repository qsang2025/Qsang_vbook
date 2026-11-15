// detail.js — Chi tiet truyen (execute(url) -> thong tin truyen).
//
// Trang chi tiet /<the loai>/<id>.html (kiem chung live 2026-11-16 voi
// 全球修仙：只有我商城降价十亿倍 /xuanhuan/53251.html):
// - h1 ten + hau to "(1-99)" (so chuong da cu) hoac "(全本)" (da xong)
//   -> cat hau to; "(全本)" => ongoing=false. Hau to co the da cu
//   (sach mau ghi (1-99) nhung muc luc that co 240 chuong) — khong
//   dung h1 de dem chuong.
// - KHONG co anh bia tren trang chi tiet nen cover de trong.
// - Tac gia / cap nhat / the loai: 3 div.autor2.
// - Mo ta: .main_content .desc.
// - The loai: suy ra tu tien to duong dan (/xuanhuan/ -> 玄幻).
// - Trang thai: mac dinh ongoing=true (site khong ghi trang thai);
//   chi false khi ten sach chua (全本)/完本/已完结 hoac muc luc co
//   chuong 完本感言/大结局/后记/全书完.
// - Muc luc nam ngay tren trang chi tiet (toc.js quet div.list).
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
    storyUrl = normalizeUrl(storyUrl);
    var r = fetchSjDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten truyen: h1 trong .box-artic (cat hau to "(全本)" / "(1-99)").
    var name = "";
    var h1 = safeFirst(doc.select(".box-artic h1"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) name = cleanBookName(h1.text());
    if (!name) {
        var titleTag = safeFirst(doc.select("title"));
        if (titleTag !== null) {
            name = cleanBookName(String(titleTag.text()).split("_")[0]);
        }
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + storyUrl);

    // Tac gia + cap nhat + the loai: 3 div.autor2.
    var author = "";
    var detail = "";
    var infos = doc.select("div.autor2");
    var i = 0;
    var infoParts = [];
    for (i = 0; i < infos.size(); i++) {
        var t = cleanText(infos.get(i).text());
        if (!t) continue;
        infoParts.push(t);
        if (t.indexOf("作者") === 0) author = t.replace(/^作者[:：]\s*/, "");
    }
    detail = infoParts.join(" | ");

    // Mo ta: .main_content .desc.
    var description = "";
    var descEl = safeFirst(doc.select(".main_content .desc"));
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
        var tocLinks = doc.select(".main_content .list li a");
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
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
