// probe.js — TAM THOI: Engine probe shenyebook.com (#108). XOA sau khi chay xong.
//
// MUC DICH: tra loi cau hoi truoc khi quyet dinh BUILD hay BO:
//   (a) Fetch tinh cua extension (UA mac dinh cua runtime) co doc duoc
//       trang chu / chi tiet / chuong khong, hay chi tra shell GDPR/CMP?
//   (b) WebView cua app co vuot qua duoc lop CMP cua consentmanager.net
//       (banner dong y) de hien noi dung that khong?
//   (c) Selector cua base Moleys v3 co con khop template hien tai khong,
//       va chuong co doc duoc khong (chuong ma hoa AES: #C0NTENT + ham d())?
//
// BOI CANH (kiem chung tu VM 2026-11-16, xem SHENYEBOOK-PROGRESS.md §2):
// - Homepage tra 200 nhung chi la shell GDPR/CMP cua consentmanager.net
//   (~27 KB, 85+ marker cmp_/gdpr, khong title, khong link sach) voi ca UA
//   desktop lan UA mobile; redirect 302 ve ww17.shenyebook.com; moi duong
//   dan (/category/, /book/<id>/, m.shenyebook.com) deu tra cung shell.
//   Shell khong co script src ngoai — toan JS inline; noi dung that khong
//   co trong HTML tinh.
// - Base Moleys v3 DOC DUOC (home/genre/gen/detail/toc/page/search/chap +
//   cryptojs.js): home tab tinh /category/0/; genre GET /category/ dung
//   .CGsectionTwo-left a; gen dung div.CGsectionTwo-right-content-unit,
//   a.title, next a#next; detail dung p.title, p.author (bo tien to tac gia),
//   .BGsectionOne-top-left img, #intro; toc dung ol.BCsectionTwo-top li
//   a.g; page dung duong dan catalog/ + #end; chap dung #C0NTENT (nua dau
//   text thuong) + script goi ham d() giai ma AES (CryptoJS, MD5 key);
//   search GET /search/<key>/<page>.
// - Sach mau (Wayback 2023-06-11, snapshot trang chu): /book/3468515565643/
//   (id 13 chu so); the loai /category/<13 chu so>/. Snapshot 2023 khong
//   chua .CGsectionTwo/.BGsectionOne — template co the da doi tu 2023,
//   hoac cac class do chi co o trang category/detail.
// - Probe KHONG tu bam chap nhan CMP (quyet dinh dong y cookie la cua Anh);
//   neu WebView ket o banner thi bao ro, de Anh mo site trong trinh duyet
//   cua app va dong y 1 lan roi chay lai probe (tien le novels.com.tw).
//
// Luu y runtime: Elements.first() KHONG BAO GIO tra null — dung size() > 0;
// fetch khong throw khi loi mang (tra fake status 504); body cua response
// chi doc 1 LAN (res.text() HOAC res.html(), khong goi ca hai); callJs phai
// tra chuoi (String(x) — ket qua khong phai chuoi se treo den timeout).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

var DETAIL_URL = BASE_URL + "/book/3468515565643/";
var SAMPLE2_URL = BASE_URL + "/book/3468515561541/";

function isShellText(t) {
    if (!t) return false;
    var s = String(t);
    return s.indexOf("consentmanager") !== -1 ||
        s.indexOf("gdprAppliesGlobally") !== -1 ||
        s.indexOf("cmp_id") !== -1 ||
        s.indexOf("_ol_one_") !== -1 ||
        s.indexOf("Do Not Sell") !== -1;
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

function absUrl(href) {
    if (!href) return "";
    href = String(href);
    if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.indexOf("/") === 0) return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function firstChapHref(doc) {
    var href = selAttr(doc, "ol.BCsectionTwo-top li a.g", "href");
    if (href) return absUrl(href);
    href = selAttr(doc, "a[href*='/read/']", "href");
    if (href) return absUrl(href);
    return "";
}

function firstBookHref(doc) {
    var href = selAttr(doc, "a[href*='/book/']", "href");
    if (href) return absUrl(href);
    href = selAttr(doc, "a[href*='/b/']", "href");
    if (href) return absUrl(href);
    return "";
}

function hasCmpBanner(doc) {
    if (selCount(doc, "#cmpbox") > 0) return true;
    if (selCount(doc, "[id*='cmpbox']") > 0) return true;
    if (selCount(doc, "#dnslink") > 0) return true;
    try {
        var bt = String(doc.select("body").text() || "").toLowerCase();
        if (bt.indexOf("cookie") !== -1) return true;
    } catch (e) {}
    return false;
}

function contentLen(doc) {
    try {
        var els = doc.select("#C0NTENT");
        if (els && els.size() > 0) return String(els.first().text() || "").length;
    } catch (e) {}
    return 0;
}

function contentSample(doc, n) {
    try {
        var els = doc.select("#C0NTENT");
        if (els && els.size() > 0) return String(els.first().text() || "").substring(0, n);
    } catch (e) {}
    return "";
}

function hasEncScript(doc) {
    try {
        var html = String(doc.html() || "");
        return html.indexOf("C0NTENT').html(d(") !== -1;
    } catch (e) {}
    return false;
}

function staticGet(url, timeoutMs) {
    return pacedFetch(url, { method: "GET", timeout: timeoutMs, maxRetries: 0 });
}

function execute() {
    var out = [];
    var staticChapUrl = "";

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
                " CMPmarkers=" + countMatches(th, /consentmanager|gdprAppliesGlobally|cmp_id|_ol_one_/g) +
                " BOOKLINKS=" + (countMatches(th, /\/book\/\d+/g) + countMatches(th, /\/b\/\d+/g)));
        }
    } catch (e) { out.push("STATIC-HOME: ERR " + e); }

    // --- B) Fetch tinh: trang chi tiet sach mau ---
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
                staticChapUrl = firstChapHref(dd);
                out.push("STATIC-DETAIL: ok status=" + rd.status + " SHELL=" + isShellText(ti) +
                    " title=[" + ti + "]" +
                    " bookName=[" + selText(dd, "p.title") + "]" +
                    " author=[" + selText(dd, "p.author") + "]" +
                    " introLen=" + selText(dd, "#intro").length +
                    " cover=[" + selAttr(dd, ".BGsectionOne-top-left img", "src") + "]" +
                    " tocLinks=" + selCount(dd, "ol.BCsectionTwo-top li a.g") +
                    " firstChap=[" + staticChapUrl + "]");
            }
        }
    } catch (e) { out.push("STATIC-DETAIL: ERR " + e); }

    // --- C) Fetch tinh: chuong dau tien (lay link tu muc luc o buoc B) ---
    try {
        if (!staticChapUrl) {
            out.push("STATIC-CHAP: SKIP (khong lay duoc link chuong tu chi tiet — trang chi tiet la shell hoac khong co muc luc)");
        } else {
            var rc = staticGet(staticChapUrl, 20000);
            if (!rc.ok || !rc.res) {
                out.push("STATIC-CHAP: FAIL status=" + rc.status + " err=" + (rc.error || "?"));
            } else {
                var dc = null;
                try { dc = rc.res.html(); } catch (e) { dc = null; }
                if (!dc) {
                    out.push("STATIC-CHAP: FAIL no-doc status=" + rc.status);
                } else {
                    var tc = selText(dc, "title");
                    var cl = contentLen(dc);
                    out.push("STATIC-CHAP: ok status=" + rc.status + " SHELL=" + isShellText(tc) +
                        " title=[" + tc + "]" +
                        " C0NTENTlen=" + cl +
                        (cl > 0 ? " sample=[" + contentSample(dc, 200) + "]" : "") +
                        " hasEncScript=" + hasEncScript(dc));
                }
            }
        }
    } catch (e) { out.push("STATIC-CHAP: ERR " + e); }

    // --- D-F) WebView: trang chu, chi tiet, chuong ---
    var b = null;
    var webBookUrl = "";
    var webChapUrl = "";
    try {
        b = Engine.newBrowser();

        // D) WebView trang chu — lop CMP co hien khong, noi dung that co len khong?
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
            var hcmp = false;
            for (var t = 0; t < 15; t++) {
                sleep(1000);
                var dh = b.html(5000);
                ht = selText(dh, "title");
                hb = selCount(dh, "a[href*='/book/']") + selCount(dh, "a[href*='/b/']");
                try { hl = String(dh.select("body").text() || "").length; } catch (e) { hl = 0; }
                hs = isShellText(ht);
                hcmp = hasCmpBanner(dh);
                webBookUrl = firstBookHref(dh);
                if (!hs && hb > 0) break;
            }
            // Doc lai cookie SAU vong poll: CMP co the dat cookie roi reload.
            try { ck = String(b.callJs("document.cookie", 5000).text() || ""); } catch (e) {}
            out.push("WEBVIEW-HOME: title=[" + ht + "] SHELL=" + hs +
                " cmpBanner=" + hcmp +
                " bookLinks=" + hb + " bodyLen=" + hl +
                " webdriver=" + wd +
                " cookieLen=" + ck.length + " cookieHasCmp=" + (ck.indexOf("cmp") !== -1) +
                " firstBook=[" + webBookUrl + "]");
        } catch (e) { out.push("WEBVIEW-HOME: ERR " + e); }

        // E) WebView trang chi tiet sach mau (uu tien link that lay duoc o buoc D) ---
        try {
            var detailUrl = webBookUrl || DETAIL_URL;
            b.launch(detailUrl, 20000);
            var et = "";
            var eb = "";
            var ea = "";
            var ei = 0;
            var er = 0;
            var es = false;
            var ec = false;
            for (var t2 = 0; t2 < 10; t2++) {
                sleep(1000);
                var de = b.html(5000);
                et = selText(de, "title");
                eb = selText(de, "p.title");
                ea = selText(de, "p.author");
                ei = selText(de, "#intro").length;
                er = selCount(de, "ol.BCsectionTwo-top li a.g");
                es = isShellText(et);
                ec = hasCmpBanner(de);
                webChapUrl = firstChapHref(de);
                if (!es && eb !== "") break;
            }
            out.push("WEBVIEW-DETAIL: url=[" + detailUrl + "] title=[" + et + "] SHELL=" + es +
                " cmpBanner=" + ec +
                " bookName=[" + eb + "] author=[" + ea + "] introLen=" + ei +
                " tocLinks=" + er + " firstChap=[" + webChapUrl + "]");
        } catch (e) { out.push("WEBVIEW-DETAIL: ERR " + e); }

        // F) WebView chuong dau tien — noi dung #C0NTENT co render khong? ---
        try {
            var chapUrl = webChapUrl || staticChapUrl;
            if (!chapUrl) {
                out.push("WEBVIEW-CHAP: SKIP (khong lay duoc link chuong tu chi tiet — chi tiet la shell hoac khong co muc luc)");
            } else {
                b.launch(chapUrl, 20000);
                var ft = "";
                var fc = 0;
                var fs = false;
                var fe = false;
                var fsample = "";
                for (var t3 = 0; t3 < 14; t3++) {
                    sleep(1000);
                    var df = b.html(5000);
                    ft = selText(df, "title");
                    fc = contentLen(df);
                    fs = isShellText(ft);
                    fe = hasEncScript(df);
                    if (fc >= 200) {
                        fsample = contentSample(df, 200);
                        break;
                    }
                }
                if (fsample === "") fsample = contentSample(df, 200);
                out.push("WEBVIEW-CHAP: url=[" + chapUrl + "] title=[" + ft + "] SHELL=" + fs +
                    " C0NTENTlen=" + fc +
                    (fc > 0 ? " sample=[" + fsample + "]" : "") +
                    " hasEncScript=" + fe);
            }
        } catch (e) { out.push("WEBVIEW-CHAP: ERR " + e); }
    } catch (e) { out.push("WEBVIEW: ERR " + e); }
    finally {
        try { if (b) b.close(); } catch (e2) {}
    }

    out.push("PROBE-DONE");
    return Response.success(out.join(" | "));
}
