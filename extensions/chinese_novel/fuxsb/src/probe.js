// probe.js — TAM THOI: Engine probe fuxsb.com (#101). XOA sau khi chay xong.
//
// MUC DICH: tra loi cau hoi truoc khi quyet dinh BUILD hay GIU O DU PHONG:
//   (a) Sau khi Anh qua challenge CF trong trinh duyet cua app, fetch cua
//       extension (dung UA mac dinh cua runtime + cookie dung chung) co doc
//       duoc trang chi tiet khong, hay van 403 "Just a moment..."?
//   (b) WebView cua app co render duoc noi dung chuong khong?
//   (c) Selector nao giu noi dung chuong, va noi dung co DAY DU khong?
//
// BOI CANH (kiem chung tu VM 2026-11-16):
// - Homepage 200 (36 KB), link sach dang /<cat>/<id>.html.
// - Trang chi tiet /chuanyue/27772.html: mobile UA tra 200 (tieu de that,
//   h1, tac gia, tag), desktop UA tra 403, curl UA mac dinh tra 403 —
//   Cloudflare chan theo duong dan + theo UA. HTML co script
//   /cdn-cgi/challenge-platform/ (tham do CF thu dong) nhung van co du
//   noi dung that.
// - Sach khong co "chuong" rieng: toan bo sach phan trang thanh
//   /chuanyue/27772.html, /chuanyue/27772_2.html, ... /chuanyue/27772_283.html
//   (283 trang). Moi trang = 1 muc "chuong" theo base Moleys v7.
// - Noi dung chuong nam trong .con_box div — lay doan text DAI NHAT
//   (div cuoi cung tren site thuong rong, nen base dung .last() se lay
//   rong — ghi chu cho buoc build).
// - Sach mau: 27772 据说我是神仙下凡 (寒星孤月, 穿越时空, 283 trang);
//   ch.1 = URL chi tiet, ch.2 = /chuanyue/27772_2.html.
//   Sach discovery: 27771 龙傲天曾为反派诞下一子 (风流客, 129 trang).
// - Trang chuong tinh tu VM: ch.1 (trang 1) 2.794 ky tu, mo dau
//   "启朝太和二十二年冬，帝与心腹重臣夜梦升仙。…"; trang 2: 2.791 ky tu,
//   mo dau "耳边忽然传来一道极低的嗡鸣声…". Khong co marker login/pay.
// - Base Moleys v7 DOC DUOC, du vong doi tru search; neu BUILD thi viet
//   lai theo hop dong hien tai (base dung let, return null, khong pacing,
//   khong Response.error, toc.js doc tong so trang sai vi link dau tien
//   la "下一页" khong co so — lay so trang lon nhat tu link phan trang).
// - Luu y runtime: khong xoay UA (quy tac nha 10 — Cloudflare gan cookie
//   voi UA cua trinh duyet da qua xac minh); dung size() > 0 de kiem tra
//   select rong; KHONG goi Engine.newBrowser().get() (khong ton tai).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

// Doan text dai nhat trong .con_box div (noi dung chuong that).
function contentLen(doc) {
    var divs = doc.select(".con_box div");
    var best = "";
    for (var i = 0; i < divs.size(); i++) {
        var t = String(divs.get(i).text() || "");
        if (t.length > best.length) best = t;
    }
    return best;
}

// So trang lon nhat tu link phan trang _<n>.html (= tong so "chuong").
function maxPage(doc) {
    var links = doc.select("a[href*='_']");
    var best = 1;
    for (var i = 0; i < links.size(); i++) {
        var h = String(links.get(i).attr("href") || "");
        var m = h.match(/_(\d+)\.html$/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    return best;
}

function hasLogin(s) {
    return s.indexOf("登录") !== -1 || s.indexOf("登入") !== -1;
}

function hasPay(s) {
    return s.indexOf("付费") !== -1 || s.indexOf("VIP") !== -1 || s.indexOf("购买") !== -1 || s.indexOf("会员") !== -1;
}

function execute() {
    var out = [];
    var detailUrl = BASE_URL + "/chuanyue/27772.html";
    var ch2Url = BASE_URL + "/chuanyue/27772_2.html";

    // --- 1) Fetch tinh trang chi tiet (dung duong extension se dung) ---
    try {
        var r = fetch(detailUrl);
        out.push("DETAIL-FETCH-OK:" + (r.ok ? "YES" : "NO"));
        out.push("DETAIL-FETCH-STATUS:" + (r.status || "?"));
        if (r.ok) {
            var doc = r.html();
            var title = String(doc.select("title").text() || "");
            var body = contentLen(doc);
            out.push("DETAIL-TITLE:[" + title + "]");
            out.push("DETAIL-CONTENT-LEN:" + body.length);
            out.push("DETAIL-CONTENT-SAMPLE:" + body.substring(0, 200));
            out.push("TOC-PAGES:" + maxPage(doc));
            var all = String(doc.select("body").text() || "");
            out.push("DETAIL-CF-SHELL:" + (all.indexOf("Just a moment") !== -1));
            out.push("DETAIL-HAS-LOGIN:" + hasLogin(all));
            out.push("DETAIL-HAS-PAY:" + hasPay(all));
        }
    } catch (e) {
        out.push("DETAIL-FETCH-ERR:" + e);
    }

    // --- 1b) Fetch tinh sach discovery (diem du lieu thu 2 cho CF) ---
    try {
        var r2 = fetch(BASE_URL + "/qihuan/27771.html");
        out.push("DISC-FETCH-OK:" + (r2.ok ? "YES" : "NO"));
        if (r2.ok) {
            var d2 = r2.html();
            out.push("DISC-TITLE:[" + String(d2.select("title").text() || "") + "]");
            out.push("DISC-CONTENT-LEN:" + contentLen(d2).length);
        }
    } catch (e2) {
        out.push("DISC-FETCH-ERR:" + e2);
    }

    // --- 2) WebView ch.1 (= trang chi tiet) ---
    var b = Engine.newBrowser();
    try {
        b.launch(detailUrl, 20000);
        out.push("LAUNCH-OK");
        var body1 = "";
        var title1 = "";
        var found1 = false;
        for (var t = 0; t < 14; t++) {
            sleep(1000);
            var doc1 = b.html(6000);
            title1 = String(doc1.select("title").text() || "");
            body1 = contentLen(doc1);
            out.push("T" + t + " title=[" + title1 + "] contentLen=" + body1.length);
            if (body1.length >= 500) { found1 = true; break; }
        }
        out.push("CH1-FOUND:" + (found1 ? "YES" : "NO"));
        out.push("CH1-LEN:" + body1.length);
        out.push("CH1-SAMPLE:" + body1.substring(0, 200));
        var all1 = String(b.html(6000).select("body").text() || "");
        out.push("HAS-LOGIN:" + hasLogin(all1));
        out.push("HAS-PAY:" + hasPay(all1));
        out.push("CF-SHELL:" + (all1.indexOf("Just a moment") !== -1));

        // --- 3) WebView ch.2 ---
        b.launch(ch2Url, 20000);
        var body2 = "";
        var found2 = false;
        for (var t2 = 0; t2 < 14; t2++) {
            sleep(1000);
            var doc2 = b.html(6000);
            body2 = contentLen(doc2);
            if (body2.length >= 500) { found2 = true; break; }
        }
        out.push("CH2-FOUND:" + (found2 ? "YES" : "NO"));
        out.push("CH2-LEN:" + body2.length);
        out.push("CH2-SAMPLE:" + body2.substring(0, 200));
    } catch (e3) {
        out.push("BROWSER-ERR:" + e3);
    } finally {
        b.close();
    }
    return Response.success(out.join(" | "));
}
