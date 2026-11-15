// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /tongren/<id>/<n>.html (kiem chung live 2026-11-16
// voi 人在箱庭，是纯血龙种 ch.1 /tongren/10307/1.html va ch.2
// /tongren/10307/2.html):
// - Noi dung trong div.read_chapterDetail (cac <p>); ch.1 co 120 <p>,
//   3520 ky tu ca khoi dau trang, ~3168 ky tu noi dung sach sau khi cat.
// - Chuong 1 co khoi dau trang trong .read_chapterDetail: <p>ten sach</p>,
//   <p>作者：...</p>, <p>简介：</p> x2, toan bo mo ta, roi <p>第1章 ten
//   chuong</p> (tieu de trong noi dung) — cat bo tu dau toi truoc dong
//   "第N章" dau tien khi thay chu ky "作者：" trong 3 <p> dau (dong
//   第N章 duoc GIU LAI vi no mang ten chuong day du, khac voi h1 chi
//   co "第N章"). Chuong 2 tro di bat dau thang vao noi dung (khong co
//   chu ky), giu nguyen.
// - Tieu de trong h1 dang "Ten truyen 第N章" -> lay phan "第N章"
//   (khop cach dat ten trong muc luc); neu khong tach duoc thi dung
//   nguyen h1.
// - Khong co trang chia trong chuong; khong co khoa VIP / dang nhap /
//   preview.
// - Link trong .read_chapterDetail (neu co) bi go bo, chi giu chu.
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
    var chapUrl = String(url || "");
    if (chapUrl.charAt(0) === "/") chapUrl = siteOrigin() + chapUrl;
    chapUrl = normalizeUrl(chapUrl);
    var r = fetchTrDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("div.read_chapterDetail"));
    if (contentEl === null) {
        return Response.error("Không đọc được nội dung chương: " + chapUrl);
    }
    // Go link trong noi dung (quang cao / dieu huong), giu lai chu.
    contentEl.select("a").remove();

    var ps = contentEl.select("p");
    if (ps.size() === 0) {
        return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
    }

    // Cat khoi dau trang o chuong 1: nhan dien bang "作者：" trong 3 <p>
    // dau, roi cat toi truoc dong "第N章" dau tien trong 20 <p> dau
    // (dong 第N章 duoc giu lai vi no mang ten chuong day du).
    var start = 0;
    var hasHeader = false;
    var i = 0;
    var scan = Math.min(3, ps.size());
    for (i = 0; i < scan; i++) {
        if (cleanText(ps.get(i).text()).indexOf("作者：") === 0) { hasHeader = true; break; }
    }
    if (hasHeader) {
        var limit = Math.min(20, ps.size());
        for (i = 0; i < limit; i++) {
            if (/^第\d+章/.test(cleanText(ps.get(i).text()))) { start = i; break; }
        }
        if (start === 0) start = Math.min(4, ps.size());
    }

    var parts = [];
    for (i = start; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (t) parts.push("<p>" + t + "</p>");
    }
    var html = parts.join("");
    if (!html || cleanText(stripTags(html)).length < 20) {
        return Response.error("Chương này chưa có nội dung (có thể bị khoá hoặc trống): " + chapUrl);
    }

    // Tieu de chuong: h1 "Ten truyen 第N章" -> lay phan "第N章".
    var title = "";
    var h1 = safeFirst(doc.select(".read_chapterName h1"));
    if (h1 === null) h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) {
        var raw = cleanText(h1.text());
        var m = /(第\d+章.*)/.exec(raw);
        if (m) title = m[1];
        else title = raw;
    }
    if (!title) title = "Chương";

    return Response.success(html, title);
}
