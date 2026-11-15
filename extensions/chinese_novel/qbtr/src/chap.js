// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /tongren/<id>/<n>.html (kiem chung live 2026-11-16):
// - Tieu de: .read_chapterName h1 ("<ten sach> 第N章").
// - Noi dung: .read_chapterDetail (the p) — CO SAN trong HTML tinh,
//   fetch truc tiep + giai ma GBK la du (khong can WebView; tien le
//   trxs.cc cung mau site). Probe Engine 2026-11-16 chi xac nhan them
//   WebView cung doc duoc (ch.1 1.493 ky tu tren may that).
// - Dau chuong lap phan gioi thieu sach 2 lan (简介 gian the + 簡介
//   phon the) truoc than bai that; cuoi chuong co 2 dong 上一篇/下一篇
//   — trimChapter (file helper.js) cat bo ca hai.
// - Khong co marker login/pay tren cac trang chuong da kiem.
// Tra Response.success(html, tieu de chuong) — tieu de lay phan "第N章"
//   trong h1 (fallback: toan bo h1).
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
    url = normalizeQbUrl(url);
    if (!url) return Response.error("Đường dẫn chương không hợp lệ.");
    var r = fetchQbDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var bodyText = String(doc.select("body").text() || "");
    if (bodyText.indexOf("登录") !== -1 || bodyText.indexOf("登入") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập nên không đọc được miễn phí.");
    }
    if (bodyText.indexOf("付费") !== -1 || bodyText.indexOf("购买") !== -1) {
        return Response.error("Chương này cần trả phí nên không đọc được miễn phí.");
    }

    var detailEl = safeFirst(doc.select(".read_chapterDetail"));
    if (detailEl === null) return Response.error("Không đọc được nội dung chương.");

    var title = "";
    var bookTitle = "";
    var h1El = safeFirst(doc.select(".read_chapterName h1"));
    if (h1El !== null) {
        var h1 = cleanText(h1El.text());
        var m = h1.match(/第[一二三四五六七八九十百零\d]+章/);
        title = m ? m[0] : h1;
        // Ten sach = h1 tru hau to " 第N章" (vd. "综漫，人在实教… 第1章").
        bookTitle = h1.replace(/\s*第[一二三四五六七八九十百零\d]+章\s*$/, "");
    }
    var html = trimChapter(detailEl, bookTitle);
    if (!html) return Response.error("Không đọc được nội dung chương.");

    return Response.success(html, title);
}
