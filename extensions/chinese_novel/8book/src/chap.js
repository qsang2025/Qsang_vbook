// chap.js — Noi dung chuong qua WebView (execute(url) -> html, title).
//
// Trang chuong tinh RONG (#text/#subtitle/#content deu rong) — noi dung
// nap qua JS + iframe share.html (kiem chung live 2026-11-16; probe tren
// may that: ch.1 2.116 ky tu, ch.2 3.610 ky tu, khong login/paywall).
// Vi vay PHAI dung Engine.newBrowser(): b.launch(url) roi poll b.html()
// cho den khi #text co du van ban. KHONG co API .get() tra Document
// (loi nay tung lam hong search.js cua sjks88 #94) — chi dung launch /
// callJs / html / close.
// URL chuong tu muc luc co the tro ve host spam sport.thepaperbooks.com
// — normalize8bUrl viet lai ve www.8book.com, GIU NGUYEN query ?<episode>.
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
    url = normalize8bUrl(url);
    if (!url) return Response.error("Đường dẫn chương không hợp lệ.");
    if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
        return Response.error("Đọc chương cần WebView của app (Engine không khả dụng).");
    }
    var b = Engine.newBrowser();
    var resultDoc = null;
    var textLen = 0;
    try {
        b.launch(url, 15000);
        for (var t = 0; t < 14; t++) {
            sleep(1000);
            resultDoc = b.html(6000);
            var tx = String(resultDoc.select("#text").text() || "");
            textLen = tx.length;
            if (textLen >= 200) break;
        }
        if (resultDoc === null || textLen < 200) {
            return Response.error("Không đọc được nội dung chương (trang trống). Hãy thử lại sau.");
        }
        var bodyText = String(resultDoc.select("body").text() || "");
        if (bodyText.indexOf("登入") !== -1 || bodyText.indexOf("登錄") !== -1) {
            return Response.error("Chương này yêu cầu đăng nhập nên không đọc được miễn phí.");
        }
        if (bodyText.indexOf("付費") !== -1 || bodyText.indexOf("購買") !== -1) {
            return Response.error("Chương này cần trả phí nên không đọc được miễn phí.");
        }
        var title = cleanText(resultDoc.select("#subtitle").text());
        if (!title) title = cleanText(resultDoc.select("title").text());
        var html = "";
        var ps = resultDoc.select("#text p");
        if (ps.size() > 0) {
            for (var i = 0; i < ps.size(); i++) {
                var pt = cleanText(ps.get(i).text());
                if (pt) html += "<p>" + pt + "</p>";
            }
        }
        if (!html) {
            var inner = resultDoc.select("#text").html();
            if (inner) html = inner;
        }
        if (!html) {
            return Response.error("Không đọc được nội dung chương (trang trống). Hãy thử lại sau.");
        }
        return Response.success(html, title);
    } catch (e) {
        return Response.error("Không đọc được nội dung chương: " + String(e));
    } finally {
        b.close();
    }
}
