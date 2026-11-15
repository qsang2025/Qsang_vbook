// probe.js — TAM THOI: Engine probe qbtr.cc (#100). XOA sau khi chay xong.
//
// MUC DICH: tra loi 3 cau hoi truoc khi quyet dinh BUILD hay DROP qbtr:
//   (a) WebView cua app co render duoc noi dung chuong khong?
//   (b) Selector nao giu noi dung chuong?
//   (c) Noi dung co DAY DU khong (van xuoi dai, khong phai teaser/rong)?
//
// BOI CANH (kiem chung tu VM 2026-11-16, 3 sach):
// - Trang chuong TINH DA CO noi dung trong div.read_chapterDetail
//   (khac rescan #12 ghi "chi 1 dong teaser 88 ky tu" — khong tai hien
//   duoc tren sach nao trong 3 sach da kiem: 10047, 10127, 10011).
// - Sach mau: 10047 (tongren) / 1.html = 1.373 ky tu, 65 doan;
//   ch.2 = 1.160 ky tu. Sach 10127: ch.1 3.442 ky tu, ch.2 3.627 ky tu.
//   Sach changgui 10011: ch.1 2.612 ky tu. Khong co dau hieu login/pay.
// - Trang chuong: h1 ".read_chapterName h1" (tua "<ten> 第N章"), noi dung
//   ".read_chapterDetail" (the p). Dau chuong lap lai phan gioi thieu
//   (tieu de + tac gia + 简介 2 lan, gian the + phan the) truoc than bai
//   that — buoc build phai cat bo phan lap nay.
// - Muc luc DAY DU tren trang chi tiet: div.book_list.clearfix ul li a
//   -> /tongren/<id>/<n>.html, text " 第N节" (sach mau 1.205 chuong).
// - Site dung GBK; base Evamirion v1 DOC DUOC (chap.js dung
//   .read_chapterDetail + .read_chapterName h1, decode gb2312) — selector
//   cua base khop site that, nhung base viet kieu cu (let, return null,
//   khong pacing, khong Response.error) nen neu BUILD thi viet lai theo
//   hop dong hien tai, khong copy nguyen.
// - Luu y runtime: Elements khong co .parent()/.children()/tagName();
//   dung size() > 0 de kiem tra select rong.
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

var SAMPLE_DETAIL = BASE_URL + "/tongren/10047.html";
var SAMPLE_CH1 = BASE_URL + "/tongren/10047/1.html";

function execute() {
    var out = [];
    var b = Engine.newBrowser();
    try {
        // --- 1) Trang chuong ch.1 ---
        b.launch(SAMPLE_CH1, 20000);
        out.push("LAUNCH-OK");
        var title = "";
        var sub = "";
        var body = "";
        var found = false;
        for (var t = 0; t < 14; t++) {
            sleep(1000);
            var doc = b.html(6000);
            title = String(doc.select("title").text() || "");
            sub = String(doc.select(".read_chapterName h1").text() || "");
            body = String(doc.select(".read_chapterDetail").text() || "");
            out.push("T" + t + " title=[" + title + "] subtitle=[" + sub + "] textLen=" + body.length);
            if (body.length >= 500) { found = true; break; }
        }
        out.push("CH1-FOUND:" + (found ? "YES" : "NO"));
        out.push("CH1-LEN:" + body.length);
        out.push("CH1-SAMPLE:" + body.substring(0, 200));
        out.push("CH1-TAIL:" + body.substring(Math.max(0, body.length - 200)));
        var introDup = 0;
        var pos = 0;
        while (true) {
            var k = body.indexOf("简介", pos);
            if (k === -1) break;
            introDup++;
            pos = k + 2;
        }
        out.push("INTRO-DUP:" + introDup);
        var all = String(b.html(6000).select("body").text() || "");
        out.push("HAS-LOGIN:" + (all.indexOf("登入") !== -1 || all.indexOf("登錄") !== -1 || all.indexOf("登录") !== -1));
        out.push("HAS-PAY:" + (all.indexOf("付費") !== -1 || all.indexOf("付费") !== -1 || all.indexOf("VIP") !== -1 || all.indexOf("購買") !== -1 || all.indexOf("购买") !== -1));
        // --- 2) Trang chi tiet: muc luc co day du trong WebView khong ---
        b.launch(SAMPLE_DETAIL, 15000);
        sleep(5000);
        var doc2 = b.html(6000);
        var links = doc2.select(".book_list a");
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
                if (url2.charAt(0) === "/") url2 = BASE_URL + url2;
                b.launch(url2, 20000);
                var body2 = "";
                var sub2 = "";
                for (var t2 = 0; t2 < 14; t2++) {
                    sleep(1000);
                    var doc3 = b.html(6000);
                    body2 = String(doc3.select(".read_chapterDetail").text() || "");
                    sub2 = String(doc3.select(".read_chapterName h1").text() || "");
                    if (body2.length >= 500) break;
                }
                out.push("CH2-SUBTITLE:" + sub2);
                out.push("CH2-LEN:" + body2.length);
                out.push("CH2-SAMPLE:" + body2.substring(0, 200));
            }
        }
    } catch (e) {
        out.push("ERR:" + e);
    } finally {
        b.close();
    }
    return Response.success(out.join(" | "));
}
