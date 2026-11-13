// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
//
// Layout da kiem chung cua https://trxs.cc/tongren/<id>.html :
//   div.book_info
//     div.pic   > img[src][alt]        (alt = ten sach sach)
//     div.infos
//       h1                             "书名(全本)" / "书名(1-490)"
//       div.date > span > a            "作者：作者名"  (+ 日期：yyyy-mm-dd)
//       div.booktips > h3 > a          txt下载 / 在线阅读
//       p                              标签：… + 简介
//   div.book_list > ul > li > a        danh sach chuong day du (toc.js dung)
//
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

// <p> cua khoi thong tin dung <br /> de ngan cach -> doi thanh xuong dong.
function brToNl(s) {
    return String(s || "")
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/<[^>]*>/g, "");
}

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("URL không hợp lệ: " + url);
    var target = BASE_URL + "/tongren/" + id + ".html";

    var r = fetchTrxsDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // name: img alt da sach; h1 mang hau to "(全本)"/"(1-490)".
    var name = "";
    var img = safeFirst(doc.select(".book_info .pic img"));
    if (img) name = cleanText(img.attr("alt"));
    var h1 = safeFirst(doc.select(".book_info .infos h1"));
    var h1Text = h1 ? cleanText(h1.text()) : "";
    if (!name && h1Text) name = cleanText(h1Text.replace(/[（(][^）)]*[）)]\s*$/, ""));
    if (!name) name = cleanText(String(doc.select("title").text() || "").split("_")[0]);
    if (!name) return Response.error("Không đọc được tên truyện từ " + target);

    var cover = "";
    if (img) {
        var src = cleanText(img.attr("src"));
        if (src && src.indexOf("nocover") === -1) cover = absUrl(src);
    }

    // author: div.date > span chua "作者：X" (X co the la <a>), doi khi rong.
    var author = "";
    var aEl = safeFirst(doc.select(".book_info .date span a"));
    if (aEl) author = cleanText(aEl.text());
    if (!author) {
        var span = safeFirst(doc.select(".book_info .date span"));
        if (span) {
            author = cleanText(span.text());
            if (author.indexOf("作者") === 0) author = cleanText(author.replace(/^作者[:：]?\s*/, ""));
        }
    }

    // description / tags / intro nam o .book_info .infos p (dong tag bat dau bang 标签：).
    var descRaw = "";
    var pEl = safeFirst(doc.select(".book_info .infos p"));
    if (pEl) descRaw = brToNl(pEl.html());
    var tags = "";
    var mTag = descRaw.match(/^\s*标签[:：]\s*([^\n]*)/);
    if (mTag) tags = cleanText(mTag[1]);
    var desc = cleanText(descRaw.replace(/^\s*标签[:：][^\n]*/, ""));
    if (!desc) desc = cleanText(String(doc.select("meta[name=description]").attr("content") || ""));
    if (desc.length > 600) desc = desc.slice(0, 600) + "...";

    var detailParts = [];
    if (author) detailParts.push("作者：" + author);
    var dateEl = safeFirst(doc.select(".book_info .date"));
    if (dateEl) {
        var dTxt = cleanText(dateEl.text());
        var mDate = dTxt.match(/日期[:：]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (mDate) detailParts.push("日期：" + mDate[1]);
    }
    if (tags) detailParts.push("标签：" + tags);
    detailParts.push(h1Text.indexOf("全本") !== -1 ? "状态：全本" : "状态：连载");

    // 全本 => hoan thanh, con lai (vd "(1-490)") => dang ra.
    var ongoing = h1Text.indexOf("全本") === -1;

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detailParts.join("<br>"),
        url: target,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: [],
        suggests: []
    });
}
