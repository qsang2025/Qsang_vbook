// probe2.js — TAM THOI: dump HTML that that cua /stories/all/ + /stories/d-51/
// tren may (probe 1: fetch tinh 200 ca hai, nhung list chi co 4 link story
// theo regex, detail bodyLen chi 3.644 ky tu, khong thay link chuong).
// XOA sau khi chay xong.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function selText(doc, sel) {
    try {
        var els = doc.select(sel);
        if (els && els.size() > 0) return String(els.first().text() || "");
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

function linkDump(doc, sel, n) {
    var out = [];
    try {
        var links = doc.select(sel);
        var i = 0;
        for (i = 0; i < links.size() && out.length < n; i++) {
            var h = String(links.get(i).attr("href") || "");
            var t = String(links.get(i).text() || "").replace(/\s+/g, " ").substring(0, 50);
            out.push(h + " {" + t + "}");
        }
    } catch (e) {}
    return out.join(" ;; ");
}

function scriptSrcs(doc, n) {
    var out = [];
    try {
        var ss = doc.select("script[src]");
        var i = 0;
        for (i = 0; i < ss.size() && out.length < n; i++) {
            out.push(String(ss.get(i).attr("src") || ""));
        }
    } catch (e) {}
    return out.join(" ;; ");
}

function execute() {
    var out = [];

    // --- LIST: /stories/all/ ---
    try {
        var rl = pacedFetch(BASE_URL + "/stories/all/", { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rl.ok || !rl.res) {
            out.push("LIST2: FAIL status=" + rl.status);
        } else {
            var dl = rl.res.html();
            var raw = "";
            try { raw = String(dl.html() || ""); } catch (e) {}
            var bt = "";
            try { bt = String(dl.select("body").text() || ""); } catch (e2) {}
            out.push("LIST2: status=" + rl.status +
                " title=[" + selText(dl, "title") + "]" +
                " h1=[" + selText(dl, "h1") + "]" +
                " article=" + selCount(dl, "article") +
                " storyA=" + selCount(dl, "a[href*='/stories/']") +
                " img=" + selCount(dl, "img") +
                " bodyLen=" + bt.length +
                " bodyText=[" + bt.substring(0, 1200) + "]" +
                " links=[" + linkDump(dl, "a[href*='/stories/']", 8) + "]" +
                " scripts=[" + scriptSrcs(dl, 8) + "]" +
                " rawHtml=[" + raw.substring(0, 1500) + "]");
        }
    } catch (e) { out.push("LIST2: ERR " + e); }

    // --- DETAIL: /stories/d-51/ ---
    try {
        var rd = pacedFetch(BASE_URL + "/stories/d-51/", { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rd.ok || !rd.res) {
            out.push("DETAIL2: FAIL status=" + rd.status);
        } else {
            var dd = rd.res.html();
            var raw2 = "";
            try { raw2 = String(dd.html() || ""); } catch (e) {}
            var bt2 = "";
            try { bt2 = String(dd.select("body").text() || ""); } catch (e2) {}
            out.push("DETAIL2: status=" + rd.status +
                " title=[" + selText(dd, "title") + "]" +
                " h1=[" + selText(dd, "h1") + "]" +
                " h2=[" + selText(dd, "h2") + "]" +
                " h3=[" + selText(dd, "h3") + "]" +
                " img=" + selCount(dd, "img") +
                " imgSrc=[" + (function () { try { var im = dd.select("img"); return im.size() > 0 ? String(im.first().attr("src") || "") : ""; } catch (e3) { return ""; } })() + "]" +
                " bodyLen=" + bt2.length +
                " bodyText=[" + bt2 + "]" +
                " allLinks=[" + linkDump(dd, "a[href]", 25) + "]" +
                " scripts=[" + scriptSrcs(dd, 8) + "]" +
                " rawHtml=[" + raw2.substring(0, 2000) + "]");
        }
    } catch (e) { out.push("DETAIL2: ERR " + e); }

    out.push("PROBE2-DONE");
    return Response.success(out.join(" | "));
}
