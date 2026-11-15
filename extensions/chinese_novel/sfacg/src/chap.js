// chap.js — Noi dung chuong (execute(url) -> chuoi HTML + tieu de).
//
// - Chuong mien phi (URL /Novel/<id>/<vol>/<chap>/): toan van nam
//   trong #ChapterBody, moi doan la 1 the <p> truc tiep (kiem chung
//   live 2026-11-16: ch.1 sach mau 123 <p>, 3.023 ky tu). Chi lay cac
//   <p> de loai khoi chrome sau chuong (打赏/投月票/上一章/下一章...).
// - Chuong VIP (URL /vip/c/<id>/ hoac trang co chu "需要付费" /
//   "本书以下章节需要付费阅读"): site chi cho xem ban xem truoc ngan
//   (ch.44 sach mau: 484 ky tu + giao dien dang ky) — KHONG tra ban
//   xem truoc nhu noi dung day du; tra loi tieng Viet ro rang, khong
//   bypass, khong dang nhap.
// - Fallback ban mobile (.yuedu): doan mo dau la text tran truoc <p>
//   dau tien, lay bang cat chuoi html; cac doan sau la <p>.
// - Tieu de: h1.article-title, fallback .article-title, fallback
//   .menu_top_list li thu 2 (ban mobile).
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
    url = normalizeSfUrl(url);
    if (!url) return Response.error("Đường dẫn chương trống.");

    // Chuong VIP: bao loi ngay, khong fetch (tranh tra ban xem truoc
    // ngan nhu noi dung day du).
    if (url.indexOf("/vip/") !== -1) {
        return Response.error("Chương VIP, cần đăng nhập hoặc mua trên web để đọc. Hãy thử chương miễn phí khác.");
    }

    var r = fetchSfDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Trang chuong khoa du hien thi ban xem truoc + chu tra phi.
    var bodyText = doc.select("body").text();
    if (bodyText.indexOf("需要付费") !== -1 || bodyText.indexOf("本书以下章节需要付费阅读") !== -1) {
        return Response.error("Chương VIP, cần đăng nhập hoặc mua trên web để đọc. Hãy thử chương miễn phí khác.");
    }

    var htm = "";
    var paras = doc.select("#ChapterBody p");
    if (paras.size() > 0) {
        var parts = [];
        for (var i = 0; i < paras.size(); i++) {
            var t = cleanText(paras.get(i).text());
            if (t) parts.push("<p>" + t + "</p>");
        }
        htm = parts.join("");
    }
    if (!htm) {
        // Fallback ban mobile: .yuedu > div[style*='text-indent'].
        var inner = safeFirst(doc.select(".yuedu > div[style*='text-indent']"));
        if (inner === null) inner = safeFirst(doc.select(".yuedu"));
        if (inner !== null) {
            var innerHtml = inner.html();
            var firstP = innerHtml.indexOf("<p");
            var lead = "";
            if (firstP > 0) lead = cleanText(stripTags(innerHtml.substring(0, firstP)));
            var mParts = [];
            if (lead) mParts.push("<p>" + lead + "</p>");
            var mParas = inner.select("p");
            for (var j = 0; j < mParas.size(); j++) {
                var mt = cleanText(mParas.get(j).text());
                if (mt) mParts.push("<p>" + mt + "</p>");
            }
            htm = mParts.join("");
        }
    }
    if (!htm) {
        return Response.error("Không đọc được nội dung chương (site có thể đã đổi giao diện).");
    }

    var title = cleanText(doc.select("h1.article-title").text());
    if (!title) title = cleanText(doc.select(".article-title").text());
    if (!title) {
        var menuLis = doc.select(".menu_top_list li");
        if (menuLis.size() > 1) title = cleanText(menuLis.get(1).text());
    }

    return Response.success(htm, title);
}
