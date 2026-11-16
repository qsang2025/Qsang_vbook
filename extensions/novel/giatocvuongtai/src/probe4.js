// probe4.js — TAM THOI: (1) /stories/all/ + detail co nhung JSON
// kieu RSC khong (khoa cover_url/chapters/content)? (2) /reader/ co
// that su doi dang nhap khong (thu WebView)? XOA sau khi chay xong.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

var STORY_ID = "b54d3a11-56f0-481d-b614-3a57a40cbb1a";
var CHAP1_ID = "0f8519ff-100b-4430-9f51-0903f1e83b11";

function selText(doc, sel) {
    try {
        var els = doc.select(sel);
        if (els && els.size() > 0) return String(els.first().text() || "");
    } catch (e) {}
    return "";
}

function ctx(text, key, before, after) {
    var i = String(text || "").indexOf(key);
    if (i < 0) return "NONE";
    return String(text).substring(Math.max(0, i - before), i + after);
}

function countMatches(text, re) {
    var m = String(text || "").match(re);
    return m ? m.length : 0;
}

function apiScan(text, n) {
    var out = [];
    var t = String(text || "");
    var idx = 0;
    var found = 0;
    while (found < n) {
        var i = t.indexOf("/api/", idx);
        if (i < 0) break;
        out.push(t.substring(Math.max(0, i - 60), i + 120).replace(/\s+/g, " "));
        idx = i + 5;
        found++;
    }
    return out.join(" || ");
}

function execute() {
    var out = [];

    // --- A) /stories/all/ raw text: co JSON nhung story khong? ---
    try {
        var rl = pacedFetch(BASE_URL + "/stories/all/", { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rl.ok || !rl.res) {
            out.push("LISTJSON: FAIL status=" + rl.status);
        } else {
            var tl = "";
            try { tl = rl.res.text(); } catch (e) { tl = ""; }
            out.push("LISTJSON: len=" + tl.length +
                " coverUrlHits=" + countMatches(tl, /cover_url/g) +
                " slugHits=" + countMatches(tl, /\"slug\"/g) +
                " storyIdHits=" + countMatches(tl, /storyId/g) +
                " apiHits=" + countMatches(tl, /\/api\//g) +
                " coverCtx=[" + ctx(tl, "cover_url", 300, 800) + "]" +
                " apiScan=[" + apiScan(tl, 5) + "]");
        }
    } catch (e) { out.push("LISTJSON: ERR " + e); }

    // --- B) Detail raw text: chapters + content trong JSON nhung? ---
    try {
        var rd = pacedFetch(BASE_URL + "/stories/d-51/", { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rd.ok || !rd.res) {
            out.push("DETAILJSON: FAIL status=" + rd.status);
        } else {
            var td = "";
            try { td = rd.res.text(); } catch (e2) { td = ""; }
            out.push("DETAILJSON: len=" + td.length +
                " chaptersKey=" + (td.indexOf("chapters") >= 0) +
                " contentKey=" + (td.indexOf("content") >= 0) +
                " chapterTitleHits=" + countMatches(td, /Đồng chí Tiểu Cận/g) +
                " chaptersCtx=[" + ctx(td, "chapters", 200, 1200) + "]" +
                " contentCtx=[" + ctx(td, "\"content\"", 200, 800) + "]" +
                " apiScan=[" + apiScan(td, 8) + "]");
        }
    } catch (e) { out.push("DETAILJSON: ERR " + e); }

    // --- C) WebView /reader/ — co doi dang nhap that khong? ---
    var b = null;
    try {
        b = Engine.newBrowser();
        try {
            b.launch(BASE_URL + "/reader/?storyId=" + STORY_ID + "&chapter=" + CHAP1_ID, 25000);
            var wt = "";
            var wb = 0;
            var ws = "";
            for (var t = 0; t < 15; t++) {
                sleep(1000);
                var dh = b.html(5000);
                wt = selText(dh, "title");
                try { wb = String(dh.select("body").text() || "").length; } catch (e3) { wb = 0; }
                try { ws = String(dh.select("body").text() || "").substring(0, 300); } catch (e4) {}
                if (wb > 500 && wt.indexOf("Đăng nhập") === -1) break;
            }
            out.push("WEBVIEW-READER: title=[" + wt + "] bodyLen=" + wb + " sample=[" + ws + "]");
        } catch (e) { out.push("WEBVIEW-READER: ERR " + e); }
    } catch (e) { out.push("WEBVIEW: ERR " + e); }
    finally {
        try { if (b) b.close(); } catch (e2) {}
    }

    out.push("PROBE4-DONE");
    return Response.success(out.join(" | "));
}
