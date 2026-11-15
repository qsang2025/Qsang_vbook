// probe.js — TAM THOI: Engine probe 8book.com (#99). XOA sau khi chay xong.
//
// MUC DICH: tra loi 3 cau hoi truoc khi quyet dinh BUILD hay DROP 8book:
//   (a) WebView cua app co render duoc noi dung chuong khong?
//   (b) Selector nao giu noi dung chuong?
//   (c) Noi dung co DAY DU khong (van xuoi dai, khong phai teaser/rong)?
//
// BOI CANH (kiem chung tu VM 2026-11-16):
// - Trang chuong tinh /read/100806/?4760535 chi co 249 ky tu chrome;
//   cac div #content, #subtitle, #text deu RONG trong HTML tinh.
// - Noi dung duoc nap qua JS: trang chuong co iframe #ifr
//   (src share.html?t=read); file read.js postMessage {id, url, eps}
//   sang iframe sau 500ms, iframe kich hoat viec dien #text.
// - Danh sach chuong tren trang chi tiet nap qua AJAX /episode/<id>/<epi>/<p>.html
//   (doan cu the ve epi chua xac dinh — probe chi dem link #chapters a).
// - Sach mau: 100806 落花時節又逢君; ch.1 = /read/100806/?4760535
//   (link "開始看第1集" tren trang chi tiet).
// - Base duongden v7 MA HOA — khong dung duoc; neu BUILD thi viet moi
//   hoan toan tu HTML WebView.
// - Luu y runtime: Elements khong co .parent()/.children()/tagName();
//   dung size() > 0 de kiem tra select rong (xem file safe-first.js).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    var out = [];
    var b = Engine.newBrowser();
    try {
        // --- 1) Trang chuong ch.1 ---
        b.launch("https://www.8book.com/read/100806/?4760535", 20000);
        out.push("LAUNCH-OK");
        var title = "";
        var sub = "";
        var body = "";
        var found = false;
        for (var t = 0; t < 14; t++) {
            sleep(1000);
            var doc = b.html(6000);
            title = String(doc.select("title").text() || "");
            sub = String(doc.select("#subtitle").text() || "");
            body = String(doc.select("#text").text() || "");
            out.push("T" + t + " title=[" + title + "] subtitle=[" + sub + "] textLen=" + body.length);
            if (body.length >= 500) { found = true; break; }
        }
        out.push("CH1-FOUND:" + (found ? "YES" : "NO"));
        out.push("CH1-LEN:" + body.length);
        out.push("CH1-SAMPLE:" + body.substring(0, 200));
        var all = String(b.html(6000).select("body").text() || "");
        out.push("HAS-LOGIN:" + (all.indexOf("登入") !== -1 || all.indexOf("登錄") !== -1));
        out.push("HAS-PAY:" + (all.indexOf("付費") !== -1 || all.indexOf("VIP") !== -1 || all.indexOf("購買") !== -1));
        // --- 2) Trang chi tiet: muc luc co nap qua AJAX trong WebView khong ---
        b.launch("https://www.8book.com/novelbooks/100806/", 15000);
        sleep(5000);
        var doc2 = b.html(6000);
        var links = doc2.select("#chapters a");
        out.push("TOC-LINKS:" + links.size());
        var tocSample = "";
        for (var i = 0; i < links.size() && i < 3; i++) {
            var a = links.get(i);
            tocSample += "[" + a.text() + " || " + a.attr("href") + "] ";
        }
        out.push("TOC-SAMPLE:" + tocSample);
        // --- 3) Chuong thu 2 (neu muc luc nap duoc): mau co lap lai khong ---
        if (links.size() > 1) {
            var href2 = String(links.get(1).attr("href") || "");
            out.push("CH2-HREF:" + href2);
            if (href2 !== "") {
                var url2 = href2;
                if (url2.charAt(0) === "/") url2 = "https://www.8book.com" + url2;
                b.launch(url2, 20000);
                var body2 = "";
                for (var t2 = 0; t2 < 14; t2++) {
                    sleep(1000);
                    var doc3 = b.html(6000);
                    body2 = String(doc3.select("#text").text() || "");
                    if (body2.length >= 500) break;
                }
                out.push("CH2-LEN:" + body2.length);
                out.push("CH2-SAMPLE:" + body2.substring(0, 120));
            }
        }
    } catch (e) {
        out.push("ERR:" + e);
    } finally {
        b.close();
    }
    return Response.success(out.join(" | "));
}
