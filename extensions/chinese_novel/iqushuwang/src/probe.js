// probe.js — TAM THOI: Engine probe iqushuwang.com (#107). XOA sau khi chay xong.
//
// MUC DICH: tra loi cau hoi truoc khi quyet dinh BUILD hay BO:
//   (a) Fetch tinh cua extension (UA mac dinh cua runtime) co doc duoc
//       trang chu / chi tiet / chuong khong, hay chi tra shell "请稍候"?
//   (b) WebView cua app co qua duoc thu thach JS (PoW + cookie _xsv) khong,
//       hay bi chan vi navigator.webdriver?
//   (c) Selector nao dung tren template mobile hien tai, va noi dung chuong
//       co DAY DU khong?
//
// BOI CANH (kiem chung tu VM 2026-11-16, xem IQUSHUWANG-PROGRESS.md §1):
// - Homepage: UA desktop/curl tra 200 nhung chi la shell "请稍候" 1.937 byte
//   (JS PoW: tinh SHA-1 den khi hash bat dau "000", dat cookie _xsv=<C>.<n>,
//   roi reload; neu navigator.webdriver thi dat _xsv=x va dung lai).
//   UA mobile tra 200 HTML day du 12.605 byte, co link sach /book/<id>/.
// - Template mobile KHAC HOAN TOAN base SoulGod v1: khong co .g-plate,
//   khong co #main ul.list, khong co #content. List dung .block/.article/
//   .listtext/.listimg; chi tiet dung meta og:novel:* + .info_chapters
//   ul.p2 li a; chuong dung div#novelcontent; muc luc phan trang 20 chuong/
//   trang: trang chi tiet = trang 1 (ch.1-20), /book/<id>/<n>/ = trang n+1,
//   tieu de "目录 （第N页/共M页）", link 下一页.
// - Chuong phan trang: <id>.html = trang 1, <id>_1.html = trang 2, tiep theo tuong tu.
//   (title "第1章 楼观雪第1页", "第1章 楼观雪第2页").
// - Sach mau: 1389 宫廷生存纪事 (妾在山阳, 浪漫言情, 连载中, 76 chuong,
//   moi nhat "第76章 番外"); ch.1 = /read/1/1389/277903.html, 2 trang:
//   p1 568 ky tu mo "楚国皇宫，摘星楼。月明星稀…", p2 578 ky tu.
//   Sach phu: 121 人生何处不青山 (chi tiet 200, da kiem chung).
// - Base SoulGod v1 DOC DUOC (chap/detail/genre/home/page/toc — thieu search)
//   nhung selector desktop cua base CHET tren template mobile: toc.js dung
//   #main ul.list (khong co), chap.js dung #content (khong co), up.js/cate.js
//   dung .g-plate (khong co), cate.js dung /fenlei/<id>/<page>/ (404).
//   Neu BUILD thi viet lai selector theo template mobile, khong port nguyen.
// - The loai /fenlei/ CHET (404) — danh sach the loai hien o /list/ (200,
//   30 link sach) nhung khong co link /fenlei/; can soi lai khi build.
// - Tim kiem: form POST /search.html, input name "s" (trong homepage, viet
//   bang document.write) — chua kiem chung, probe khong test search.
//
// Luu y runtime: Elements.first() KHONG BAO GIO tra null — dung size() > 0;
// fetch khong throw khi loi mang (tra fake status 504); body cua response
// chi doc 1 LAN (res.text() HOAC res.html(), khong goi ca hai); callJs phai
// tra chuoi (String(x) — ket qua khong phai chuoi se treo den timeout).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

var DETAIL_URL = BASE_URL + "/book/1389/";
var CHAP_URL = BASE_URL + "/read/1/1389/277903.html";
var TOC_URL = BASE_URL + "/book/1389/1/";

function isShellText(t) {
    if (!t) return false;
    var s = String(t);
    return s.indexOf("请稍候") !== -1 || s.indexOf("正在打开页面") !== -1;
}

function stripTags(html) {
    var t = String(html || "");
    t = t.replace(/<[^>]+>/g, " ");
    t = t.replace(/\s+/g, " ");
    return t;
}

function countMatches(text, re) {
    var m = String(text || "").match(re);
    return m ? m.length : 0;
}

function selText(doc, sel) {
    try {
        var els = doc.select(sel);
        if (els && els.size() > 0) return String(els.first().text() || "");
    } catch (e) {}
    return "";
}

function selAttr(doc, sel, attr) {
    try {
        var els = doc.select(sel);
        if (els && els.size() > 0) return String(els.first().attr(attr) || "");
    } catch (e) {}
    return "";
}

function selCount(doc, sel) {
    try {
        var els = doc.select(sel);
        return els ? els.size() : 0;
    } catch (e) {}
    return 0;
}

function staticGet(url, timeoutMs) {
    return pacedFetch(url, { method: "GET", timeout: timeoutMs, maxRetries: 0 });
}

function execute() {
    var out = [];

    // --- A) Fetch tinh: trang chu ---
    try {
        var rh = staticGet(BASE_URL + "/", 20000);
        if (!rh.ok || !rh.res) {
            out.push("STATIC-HOME: FAIL status=" + rh.status + " err=" + (rh.error || "?"));
        } else {
            var th = "";
            try { th = rh.res.text(); } catch (e) { th = ""; }
            out.push("STATIC-HOME: ok status=" + rh.status + " bodyLen=" + th.length +
                " SHELL=" + isShellText(th) +
                " BOOKLINKS=" + countMatches(th, /\/book\/\d+\//g));
        }
    } catch (e) { out.push("STATIC-HOME: ERR " + e); }

    // --- B) Fetch tinh: trang chi tiet sach mau 1389 ---
    try {
        var rd = staticGet(DETAIL_URL, 20000);
        if (!rd.ok || !rd.res) {
            out.push("STATIC-DETAIL: FAIL status=" + rd.status + " err=" + (rd.error || "?"));
        } else {
            var dd = null;
            try { dd = rd.res.html(); } catch (e) { dd = null; }
            if (!dd) {
                out.push("STATIC-DETAIL: FAIL no-doc status=" + rd.status);
            } else {
                var ti = selText(dd, "title");
                out.push("STATIC-DETAIL: ok status=" + rd.status + " SHELL=" + isShellText(ti) +
                    " title=[" + ti + "]" +
                    " bookName=[" + selAttr(dd, "meta[property=\"og:novel:book_name\"]", "content") + "]" +
                    " author=[" + selAttr(dd, "meta[property=\"og:novel:author\"]", "content") + "]" +
                    " latest=[" + selAttr(dd, "meta[property=\"og:novel:latest_chapter_name\"]", "content") + "]" +
                    " readLinks=" + selCount(dd, "a[href*='/read/']"));
            }
        }
    } catch (e) { out.push("STATIC-DETAIL: ERR " + e); }

    // --- C) Fetch tinh: chuong 1 sach mau ---
    try {
        var rc = staticGet(CHAP_URL, 20000);
        if (!rc.ok || !rc.res) {
            out.push("STATIC-CHAP: FAIL status=" + rc.status + " err=" + (rc.error || "?"));
        } else {
            var dc = null;
            try { dc = rc.res.html(); } catch (e) { dc = null; }
            if (!dc) {
                out.push("STATIC-CHAP: FAIL no-doc status=" + rc.status);
            } else {
                var tc = selText(dc, "title");
                var nc = "";
                try {
                    var ncs = dc.select("#novelcontent");
                    if (ncs && ncs.size() > 0) nc = String(ncs.first().text() || "");
                } catch (e) {}
                out.push("STATIC-CHAP: ok status=" + rc.status + " SHELL=" + isShellText(tc) +
                    " title=[" + tc + "]" +
                    " novelcontentLen=" + nc.length +
                    (nc.length > 0 ? " sample=[" + nc.substring(0, 200) + "]" : "") +
                    " hasNextPage=" + (selCount(dc, "a[href$='_1.html']") > 0));
            }
        }
    } catch (e) { out.push("STATIC-CHAP: ERR " + e); }

    // --- D-G) WebView: trang chu, chi tiet, chuong, muc luc ---
    var b = null;
    try {
        b = Engine.newBrowser();

        // D) WebView trang chu — thu thach PoW co chay khong?
        try {
            b.launch(BASE_URL + "/", 20000);
            var wd = "";
            var ck = "";
            try { wd = String(b.callJs("String(navigator.webdriver)", 5000).text() || ""); } catch (e) { wd = "ERR:" + e; }
            try { ck = String(b.callJs("document.cookie", 5000).text() || ""); } catch (e) { ck = "ERR:" + e; }
            var ht = "";
            var hb = 0;
            var hl = 0;
            var hs = false;
            for (var t = 0; t < 15; t++) {
                sleep(1000);
                var dh = b.html(5000);
                ht = selText(dh, "title");
                hb = selCount(dh, "a[href*='/book/']");
                try { hl = String(dh.select("body").text() || "").length; } catch (e) { hl = 0; }
                hs = isShellText(ht);
                if (!hs && hb > 0) break;
            }
            // Doc lai cookie SAU vong poll: trang challenge reload sau khi dat
            // cookie _xsv, doc ngay sau launch co the chua thay.
            try { ck = String(b.callJs("document.cookie", 5000).text() || ""); } catch (e) {}
            out.push("WEBVIEW-HOME: title=[" + ht + "] SHELL=" + hs +
                " bookLinks=" + hb + " bodyLen=" + hl +
                " webdriver=" + wd + " cookieHasXsv=" + (ck.indexOf("_xsv=") !== -1));
        } catch (e) { out.push("WEBVIEW-HOME: ERR " + e); }

        // E) WebView trang chi tiet sach mau ---
        try {
            b.launch(DETAIL_URL, 20000);
            var et = "";
            var eb = "";
            var ea = "";
            var el = "";
            var er = 0;
            var es = false;
            for (var t2 = 0; t2 < 10; t2++) {
                sleep(1000);
                var de = b.html(5000);
                et = selText(de, "title");
                eb = selAttr(de, "meta[property=\"og:novel:book_name\"]", "content");
                ea = selAttr(de, "meta[property=\"og:novel:author\"]", "content");
                el = selAttr(de, "meta[property=\"og:novel:latest_chapter_name\"]", "content");
                er = selCount(de, "a[href*='/read/']");
                es = isShellText(et);
                if (!es && eb !== "") break;
            }
            out.push("WEBVIEW-DETAIL: title=[" + et + "] SHELL=" + es +
                " bookName=[" + eb + "] author=[" + ea + "] latest=[" + el + "]" +
                " readLinks=" + er);
        } catch (e) { out.push("WEBVIEW-DETAIL: ERR " + e); }

        // F) WebView chuong 1 — noi dung co render khong? ---
        try {
            b.launch(CHAP_URL, 20000);
            var ft = "";
            var fc = "";
            var fs = false;
            var fn = false;
            for (var t3 = 0; t3 < 14; t3++) {
                sleep(1000);
                var df = b.html(5000);
                ft = selText(df, "title");
                try {
                    var ncs = df.select("#novelcontent");
                    if (ncs && ncs.size() > 0) fc = String(ncs.first().text() || "");
                } catch (e) { fc = ""; }
                fs = isShellText(ft);
                fn = selCount(df, "a[href$='_1.html']") > 0;
                if (fc.length >= 500) break;
            }
            out.push("WEBVIEW-CHAP: title=[" + ft + "] SHELL=" + fs +
                " novelcontentLen=" + fc.length +
                (fc.length > 0 ? " sample=[" + fc.substring(0, 200) + "]" : "") +
                " hasNextPage=" + fn);
        } catch (e) { out.push("WEBVIEW-CHAP: ERR " + e); }

        // G) WebView trang muc luc /book/1389/1/ ---
        try {
            b.launch(TOC_URL, 15000);
            var gt = "";
            var gh = "";
            var gc = 0;
            var gs = false;
            for (var t4 = 0; t4 < 8; t4++) {
                sleep(1000);
                var dg = b.html(5000);
                gt = selText(dg, "title");
                gh = selText(dg, ".info_chapters .p1");
                gc = selCount(dg, "a[href*='/read/']");
                gs = isShellText(gt);
                if (!gs && gc > 0) break;
            }
            out.push("WEBVIEW-TOC: title=[" + gt + "] SHELL=" + gs +
                " header=[" + gh + "] chapLinks=" + gc);
        } catch (e) { out.push("WEBVIEW-TOC: ERR " + e); }
    } catch (e) { out.push("WEBVIEW: ERR " + e); }
    finally {
        try { if (b) b.close(); } catch (e2) {}
    }

    out.push("PROBE-DONE");
    return Response.success(out.join(" | "));
}
