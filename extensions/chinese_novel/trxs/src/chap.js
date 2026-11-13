// chap.js — doc noi dung mot chuong (execute(url) -> HTML, tieu de o data2).
//
// Layout da kiem chung cua https://trxs.cc/tongren/<id>/<n>.html :
//   div.read_chapterName.tc   "书名 第N章 作者：X"
//   div.read_chapterDetail    <p>书名 作者：X</p><p></p><p>简介：…</p>…<p>第1章 标题</p><p></p><p>正文…</p>
// Khoi detail lap lai ten sach / tac gia / gioi thieu truoc noi dung that,
// nen noi dung bat dau o doan dau tien co dang "第N章 ..." (fallback: doan
// dau tien khong phai header — xem trimChapter o file helper.js).
// Chuong doc DU, KHONG can dang nhap (kiem chung ch.1 人在木叶，战场收尸十年
// va ch.1 穿越八年才出道: noi dung dung truyen goc, khong preview, khong 401).
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

function execute(url) {
    var u = String(url || "");
    var m = u.match(/\/tongren\/(\d+)\/(\d+)\.html/);
    if (!m) return Response.error("URL chương không hợp lệ: " + url);
    var target = BASE_URL + "/tongren/" + m[1] + "/" + m[2] + ".html";

    var r = fetchTrxsDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var cont = safeFirst(doc.select(".read_chapterDetail"));
    if (!cont) cont = safeFirst(doc.select(".content .read_chapterDetail"));
    if (!cont) return Response.error("Không tìm thấy nội dung chương tại " + target);

    cont.select("script, style").remove();
    var trimmed = trimChapter(cont.html() + "");
    var html = trimmed.html;
    var title = trimmed.title;
    if (!title) title = chapterNameTitle(doc);

    // Cat ria va gon cac doan <p> rong lien tiep.
    html = html.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "");
    html = html.replace(/(<p>\s*(?:&nbsp;|<br\s*\/?\s*>)?\s*<\/p>\s*){2,}/gi, "");
    html = html.replace(/<\/?(?:div|span)[^>]*>/gi, "");
    if (!html || html.length < 10) return Response.error("Nội dung chương rỗng: " + target);
    return Response.success(html, title);
}
