// probe3.js — TAM THOI: tim API/JS nap danh sach + noi dung chuong.
// Probe 2 ket luan: /stories/all/ chi co "Dang tai truyen..." (client
// render); detail co du noi dung tinh + link chuong dang
// /reader/?storyId=<uuid>&chapter=<uuid>. XOA sau khi chay xong.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

var STORY_ID = "b54d3a11-56f0-481d-b614-3a57a40cbb1a";
var CHAP1_ID = "0f8519ff-100b-4430-9f51-0903f1e83b11";
var CHAP2_ID = "f3b9c169-09ab-4c06-8c78-fa3beea30dc2";

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

function execute() {
    var out = [];

    // --- A) Inline scripts cua /stories/all/ — tim duong API nap truyen ---
    try {
        var rl = pacedFetch(BASE_URL + "/stories/all/", { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rl.ok || !rl.res) {
            out.push("LISTJS: FAIL status=" + rl.status);
        } else {
            var dl = rl.res.html();
            var scripts = dl.select("script:not([src])");
            var found = [];
            var i = 0;
            for (i = 0; i < scripts.size(); i++) {
                var code = String(scripts.get(i).html() || "");
                if (!code) continue;
                if (code.indexOf("/api/") !== -1 || code.indexOf("fetch(") !== -1 || code.indexOf("stories") !== -1) {
                    found.push("INLINE[" + i + "] len=" + code.length + " :: " + code.substring(0, 900));
                }
            }
            var raw = "";
            try { raw = String(dl.html() || ""); } catch (e) {}
            var apiIdx = raw.indexOf("/api/");
            out.push("LISTJS: inlineScripts=" + scripts.size() + " apiHits=" + found.length +
                " firstApiCtx=[" + (apiIdx >= 0 ? raw.substring(Math.max(0, apiIdx - 200), apiIdx + 300) : "NONE") + "]" +
                " hits=[" + found.join(" || ") + "]");
        }
    } catch (e) { out.push("LISTJS: ERR " + e); }

    // --- B) Trang doc chuong /reader/ — fetch tinh ---
    try {
        var rc = pacedFetch(BASE_URL + "/reader/?storyId=" + STORY_ID + "&chapter=" + CHAP1_ID, { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rc.ok || !rc.res) {
            out.push("READER: FAIL status=" + rc.status + " err=" + (rc.error || "?"));
        } else {
            var dc = rc.res.html();
            var bt = "";
            try { bt = String(dc.select("body").text() || ""); } catch (e2) {}
            var rawc = "";
            try { rawc = String(dc.html() || ""); } catch (e3) {}
            var apiIdx2 = rawc.indexOf("/api/");
            out.push("READER: status=" + rc.status +
                " title=[" + selText(dc, "title") + "]" +
                " h1=[" + selText(dc, "h1") + "]" +
                " bodyLen=" + bt.length +
                " p=" + selCount(dc, "p") +
                " article=" + selCount(dc, "article") + " main=" + selCount(dc, "main") +
                " sample=[" + bt.substring(0, 600) + "]" +
                " firstApiCtx=[" + (apiIdx2 >= 0 ? rawc.substring(Math.max(0, apiIdx2 - 200), apiIdx2 + 300) : "NONE") + "]");
        }
    } catch (e) { out.push("READER: ERR " + e); }

    // --- C) Doan HTML quanh "The loai" tren trang chi tiet (link the loai?) ---
    try {
        var rd = pacedFetch(BASE_URL + "/stories/d-51/", { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!rd.ok || !rd.res) {
            out.push("GENREHTML: FAIL status=" + rd.status);
        } else {
            var raw3 = "";
            try { raw3 = String(rd.res.text() || ""); } catch (e4) {}
            var gi = raw3.indexOf("Thể loại");
            var ci = raw3.indexOf("Danh sách chương");
            out.push("GENREHTML: genreCtx=[" + (gi >= 0 ? raw3.substring(gi, gi + 1200) : "NONE") + "]" +
                " chapListCtx=[" + (ci >= 0 ? raw3.substring(Math.max(0, ci - 300), ci + 1200) : "NONE") + "]");
        }
    } catch (e) { out.push("GENREHTML: ERR " + e); }

    out.push("PROBE3-DONE");
    return Response.success(out.join(" | "));
}
