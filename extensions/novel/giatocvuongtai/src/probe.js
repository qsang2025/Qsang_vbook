// probe.js — TAM THOI: Engine probe giatocvuongtai.com (#111). XOA sau khi chay xong.
//
// MUC DICH: tra loi cau hoi truoc khi quyet dinh BUILD hay BO:
//   (a) Fetch tinh cua extension (UA mac dinh cua runtime) co doc duoc
//       /stories/all/ + chi tiet + chuong khong, nho cookie cf_clearance
//       Anh da qua CF 1 lan trong trinh duyet cua app (2026-11-16 16:37)?
//   (b) Neu fetch tinh van bi CF chan thi WebView cua app co vuot qua
//       duoc challenge khong (cookie dung chung)?
//   (c) Selector that cua trang chi tiet / muc luc / chuong la gi
//       (site Astro SSR, khong co base trong fork — viet moi hoan toan)?
//
// BOI CANH (kiem chung tu VM 2026-11-16, xem FORK-SCAN-2026-11-16-3.md):
// - Homepage 200 day du HTML (~140 KB): card truyen article, cover
//   covers.giatocvuongtai.com, h3 a ten, p span tac gia + dich gia.
// - /stories/all/ + /stories/<slug>/ tra 403 "Just a moment..." tu VM
//   ca hai UA (Cloudflare challenge). /api/public/settings 200 JSON;
//   /api/public/stories 404.
// - Sach mau: /stories/d-51/ "[EDIT] BIẾT ĐƯỜNG" (NHẤT NHỊ NHỊ,
//   dich: Càpu Cápu) — lay tu trang chu; chuong mau lay link dau tien
//   tu trang chi tiet.
// - Probe KHONG tu bam chap nhan CF (quyet dinh xac minh la cua Anh —
//   Anh da qua 1 lan); neu WebView ket o challenge thi bao ro.
// - Tien le: fuxsb #101 (CF chan theo UA), novels.com.tw (qua CF trong
//   in-app browser, cookie dung chung).
//
// Luu y runtime: Elements.first() KHONG BAO GIO tra null — dung size() > 0;
// fetch khong throw khi loi mang (tra fake status 504); body cua response
// chi doc 1 LAN (res.text() HOAC res.html(), khong goi ca hai); callJs phai
// tra chuoi (String(x) — ket qua khong phai chuoi se treo den timeout).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

var DETAIL_URL = BASE_URL + "/stories/d-51/";
var LIST_URL = BASE_URL + "/stories/all/";

function isCfText(t) {
    if (!t) return false;
    var s = String(t);
    return s.indexOf("Just a moment") !== -1 ||
        s.indexOf("challenges.cloudflare.com") !== -1 ||
        s.indexOf("cf-challenge") !== -1;
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

// Lay link chuong dau tien tu trang chi tiet: link /stories/<slug>/...
// khac chinh URL chi tiet, hoac link chua "chuong"/"chapter".
function firstChapHref(doc, detailUrl) {
    var links = doc.select("a[href*='/stories/']");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var h = String(links.get(i).attr("href") || "");
        if (!h) continue;
        var full = absUrl(h);
        if (full === detailUrl || full === detailUrl.replace(/\/$/, "")) continue;
        if (full.indexOf("/stories/") === 0 || full.indexOf(BASE_URL + "/stories/") === 0) {
            return full;
        }
    }
    return "";
}

function chapHrefSamples(doc, detailUrl, n) {
    var out = [];
    var links = doc.select("a[href*='/stories/']");
    var i = 0;
    for (i = 0; i < links.size() && out.length < n; i++) {
        var h = String(links.get(i).attr("href") || "");
        if (!h) continue;
        var full = absUrl(h);
        if (full === detailUrl || full === detailUrl.replace(/\/$/, "")) continue;
        out.push(full + " [" + String(links.get(i).text() || "").substring(0, 40) + "]");
    }
    return out.join(" ;; ");
}

function bodyTextLen(doc) {
    try {
        return String(doc.select("body").text() || "").length;
    } catch (e) {}
    return 0;
}

function contentProbe(doc) {
    // Thu cac vung chua noi dung chuong co the co; bao do dai tung vung.
    var parts = [];
    var sels = ["article", "main", "[class*='chapter']", "[class*='content']", "[class*='Chapter']"];
    var i = 0;
    for (i = 0; i < sels.length; i++) {
        var t = selText(doc, sels[i]);
        parts.push(sels[i] + "=" + t.length);
    }
    parts.push("p=" + selCount(doc, "p"));
    parts.push("articleP=" + selCount(doc, "article p"));
    return parts.join(" ");
}

function staticGet(url, timeoutMs) {
    return pacedFetch(url, { method: "GET", timeout: timeoutMs, maxRetries: 0 });
}

function execute() {
    var out = [];
    var staticChapUrl = "";
    var webChapUrl = "";

    // --- A) Fetch tinh: trang chu ---
    try {
        var rh = staticGet(BASE_URL + "/", 20000);
        if (!rh.ok || !rh.res) {
            out.push("STATIC-HOME: FAIL status=" + rh.status + " err=" + (rh.error || "?"));
        } else {
            var th = "";
            try { th = rh.res.text(); } catch (e) { th = ""; }
            out.push("STATIC-HOME: ok status=" + rh.status + " bodyLen=" + th.length +
                " CF=" + isCfText(th) +
                " STORYLINKS=" + countMatches(th, /\/stories\/[a-z0-9\-]+\//g));
        }
    } catch (e) { out.push("STATIC-HOME: ERR " + e); }

    // --- B) Fetch tinh: danh sach truyen /stories/all/ (diem CF chan tu VM) ---
    try {
        var rl = staticGet(LIST_URL, 20000);
        if (!rl.ok || !rl.res) {
            out.push("STATIC-LIST: FAIL status=" + rl.status + " err=" + (rl.error || "?"));
        } else {
            var tl = "";
            try { tl = rl.res.text(); } catch (e) { tl = ""; }
            out.push("STATIC-LIST: ok status=" + rl.status + " bodyLen=" + tl.length +
                " CF=" + isCfText(tl) +
                " STORYLINKS=" + countMatches(tl, /\/stories\/[a-z0-9\-]+\//g));
        }
    } catch (e) { out.push("STATIC-LIST: ERR " + e); }

    // --- C) Fetch tinh: trang chi tiet sach mau ---
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
                staticChapUrl = firstChapHref(dd, DETAIL_URL);
                out.push("STATIC-DETAIL: ok status=" + rd.status + " CF=" + isCfText(ti) +
                    " title=[" + ti + "]" +
                    " h1=[" + selText(dd, "h1") + "]" +
                    " cover=[" + selAttr(dd, "img[alt*='Bìa truyện']", "src") + "]" +
                    " storyLinks=" + selCount(dd, "a[href*='/stories/']") +
                    " bodyLen=" + bodyTextLen(dd) +
                    " firstChap=[" + staticChapUrl + "]" +
                    " chapSamples=[" + chapHrefSamples(dd, DETAIL_URL, 3) + "]");
            }
        }
    } catch (e) { out.push("STATIC-DETAIL: ERR " + e); }

    // --- D) Fetch tinh: chuong dau tien (lay link tu muc luc o buoc C) ---
    try {
        if (!staticChapUrl) {
            out.push("STATIC-CHAP: SKIP (khong lay duoc link chuong tu chi tiet)");
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
                    var bt = bodyTextLen(dc);
                    var sample = "";
                    try { sample = String(dc.select("body").text() || "").substring(0, 200); } catch (e2) {}
                    out.push("STATIC-CHAP: ok status=" + rc.status + " CF=" + isCfText(tc) +
                        " title=[" + tc + "] h1=[" + selText(dc, "h1") + "]" +
                        " bodyLen=" + bt + " " + contentProbe(dc) +
                        " sample=[" + sample + "]");
                }
            }
        }
    } catch (e) { out.push("STATIC-CHAP: ERR " + e); }

    // --- E-G) WebView: danh sach, chi tiet, chuong ---
    var b = null;
    try {
        b = Engine.newBrowser();

        // E) WebView danh sach truyen — challenge CF co qua khong?
        try {
            b.launch(LIST_URL, 20000);
            var ck = "";
            try { ck = String(b.callJs("document.cookie", 5000).text() || ""); } catch (e) { ck = "ERR:" + e; }
            var lt = "";
            var ll = 0;
            var lb = 0;
            var lc = false;
            for (var t = 0; t < 15; t++) {
                sleep(1000);
                var dh = b.html(5000);
                lt = selText(dh, "title");
                ll = selCount(dh, "a[href*='/stories/']");
                lb = bodyTextLen(dh);
                lc = isCfText(lt);
                if (!lc && ll > 0) break;
            }
            try { ck = String(b.callJs("document.cookie", 5000).text() || ""); } catch (e2) {}
            out.push("WEBVIEW-LIST: title=[" + lt + "] CF=" + lc +
                " storyLinks=" + ll + " bodyLen=" + lb +
                " cookieLen=" + ck.length + " hasCfClearance=" + (ck.indexOf("cf_clearance") !== -1));
        } catch (e) { out.push("WEBVIEW-LIST: ERR " + e); }

        // F) WebView trang chi tiet sach mau ---
        try {
            b.launch(DETAIL_URL, 20000);
            var et = "";
            var eh = "";
            var el = 0;
            var eb = 0;
            var ec = false;
            for (var t2 = 0; t2 < 10; t2++) {
                sleep(1000);
                var de = b.html(5000);
                et = selText(de, "title");
                eh = selText(de, "h1");
                el = selCount(de, "a[href*='/stories/']");
                eb = bodyTextLen(de);
                ec = isCfText(et);
                webChapUrl = firstChapHref(de, DETAIL_URL);
                if (!ec && eh !== "") break;
            }
            out.push("WEBVIEW-DETAIL: title=[" + et + "] CF=" + ec +
                " h1=[" + eh + "] storyLinks=" + el + " bodyLen=" + eb +
                " firstChap=[" + webChapUrl + "]" +
                " chapSamples=[" + chapHrefSamples(b.html(5000), DETAIL_URL, 3) + "]");
        } catch (e) { out.push("WEBVIEW-DETAIL: ERR " + e); }

        // G) WebView chuong dau tien ---
        try {
            var chapUrl = webChapUrl || staticChapUrl;
            if (!chapUrl) {
                out.push("WEBVIEW-CHAP: SKIP (khong lay duoc link chuong tu chi tiet)");
            } else {
                b.launch(chapUrl, 20000);
                var ft = "";
                var fb = 0;
                var fc = false;
                var fsample = "";
                var fprobe = "";
                for (var t3 = 0; t3 < 14; t3++) {
                    sleep(1000);
                    var df = b.html(5000);
                    ft = selText(df, "title");
                    fb = bodyTextLen(df);
                    fc = isCfText(ft);
                    fprobe = contentProbe(df);
                    if (!fc && fb >= 500) {
                        try { fsample = String(df.select("body").text() || "").substring(0, 200); } catch (e3) {}
                        break;
                    }
                }
                if (fsample === "") {
                    try { fsample = String(b.html(5000).select("body").text() || "").substring(0, 200); } catch (e4) {}
                }
                out.push("WEBVIEW-CHAP: url=[" + chapUrl + "] title=[" + ft + "] CF=" + fc +
                    " bodyLen=" + fb + " " + fprobe +
                    " sample=[" + fsample + "]");
            }
        } catch (e) { out.push("WEBVIEW-CHAP: ERR " + e); }
    } catch (e) { out.push("WEBVIEW: ERR " + e); }
    finally {
        try { if (b) b.close(); } catch (e2) {}
    }

    out.push("PROBE-DONE");
    return Response.success(out.join(" | "));
}
