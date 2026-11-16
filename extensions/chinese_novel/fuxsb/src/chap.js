// chap.js — Noi dung 1 trang sach (execute(url) -> html, tieu de).
//
// Trang chuong /<cat>/<id>.html (ch.1) hoac /<cat>/<id>_<N>.html
// (kiem chung live 2026-11-16 + probe tren may that: ch.1 2.790 ky tu,
// ch.2 2.787 ky tu, van xuoi that):
// - Noi dung: div text DAI NHAT trong .con_box (sua loi base Moleys v7:
//   base lay .con_box div .last() — div cuoi tren site thuong RONG,
//   0 ky tu trong ca 3 trang da kiem). Cac div khac trong .con_box la
//   breadcrumb, phan trang, 推荐文章, footer — deu ngan hon nhieu.
// - Tra ve HTML goc cua div do (cac <p>), chi xoa chuoi quang cao
//   "Fxsw.org" (base lam vay). Khong chay cleanHtml day du — noi dung
//   sach da sach, tranh sua doi van ban goc.
// - Tieu de: 第N章 suy tu URL (_<N>.html -> 第N章; .html thuong -> 第1章).
// - Khong co marker login/pay tren cac trang da kiem; van kiem tra
//   truoc khi tra ve (neu co thi bao loi tieng Viet ro rang).
// - Fetch tinh la duong chinh (probe tren may that: DETAIL-FETCH-OK,
//   CH1/CH2-FOUND qua ca fetch tinh lan WebView); fetchFxDoc tu thu
//   browser fallback neu gap trang challenge Cloudflare.
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
    url = normalizeFxUrl(url);
    if (!url) return Response.error("Đường dẫn chương không hợp lệ.");
    var r = fetchFxDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var bodyText = String(doc.select("body").text() || "");
    if (bodyText.indexOf("登录") !== -1 || bodyText.indexOf("登入") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập nên không đọc được miễn phí.");
    }
    if (bodyText.indexOf("付费") !== -1 || bodyText.indexOf("购买") !== -1) {
        return Response.error("Chương này cần trả phí nên không đọc được miễn phí.");
    }

    // Doan text dai nhat trong .con_box div — chinh la noi dung trang.
    var bestHtml = "";
    var bestLen = 0;
    var divs = doc.select(".con_box div");
    for (var i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var t = String(d.text() || "");
        var len = 0;
        try { len = t.length; } catch (e) { len = 0; }
        if (len > bestLen) {
            bestLen = len;
            try { bestHtml = d.html() + ""; } catch (e2) { bestHtml = ""; }
        }
    }
    if (!bestHtml || bestLen < 100) {
        return Response.error("Không đọc được nội dung chương.");
    }
    var html = bestHtml.replace(/Fxsw\.org/g, "");
    if (!html || cleanText(stripTags(html)).length < 100) {
        return Response.error("Không đọc được nội dung chương.");
    }

    var title = "第1章";
    var m = url.match(/_(\d+)\.html$/);
    if (m) title = "第" + parseInt(m[1], 10) + "章";

    return Response.success(html, title);
}
