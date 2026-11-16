// probe.js — TAM THOI: kiem tra API wtr-lab.com tren may that (xoa sau khi xong).
//
// Buoc 1: GET /api/chapters/115146 (muc luc — GET chay nhanh ca tu VM).
// Buoc 2: POST /api/reader/get dich vu "ai" cho ch.1 sach mau 115146
//   (Going Back to '98..., ch.1 id 58283374, 1.781 ky tu, locked:false).
//   POST nay TREO tu VM — muc dich chinh cua probe la xem no co chay
//   tren may that khong. Bao cao: success / requireTurnstile / code /
//   error / co content_url khong / do dai body + mau 200 ky tu.
// Buoc 3: neu co content_url thi GET no (co chu ky, GET nhanh) lay body.
// Buoc 4: POST /api/search {text:"Going Back"} — cung treo tu VM.
// Buoc 5 (du phong neu POST treo ca tren may): mo trang chuong bang
//   WebView, poll .chapter-body moi 1s toi da 14s — xem text co render
//   khong (tien le 8book #99).
// Moi POST dung timeout 20s + maxRetries 0 de probe khong keo dai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load('config.js');
load('rate-limit.js');
load('fetch-helpers.js');

function postJson(url, obj, timeoutMs) {
    var r = pacedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(obj),
        timeout: timeoutMs,
        maxRetries: 0
    });
    if (!r.ok) return { ok: false, status: r.status || 0, error: r.error || ("HTTP " + (r.status || "?")) };
    var j = null;
    try { j = r.res.json(); } catch (e) { return { ok: false, status: r.status, error: "JSON loi: " + e }; }
    return { ok: true, status: r.status, json: j };
}

function getJson(url, timeoutMs) {
    var r = pacedFetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        timeout: timeoutMs,
        maxRetries: 0
    });
    if (!r.ok) return { ok: false, status: r.status || 0, error: r.error || ("HTTP " + (r.status || "?")) };
    var j = null;
    try { j = r.res.json(); } catch (e) { return { ok: false, status: r.status, error: "JSON loi: " + e }; }
    return { ok: true, status: r.status, json: j };
}

function bodyTextOf(j) {
    // data.data.body (chuoi HTML hoac text) — tra ve text sach + do dai.
    try {
        var d = j && j.data;
        var inner = d && d.data;
        var b = inner && inner.body;
        if (typeof b === "string") return b;
        if (b && typeof b === "object") return JSON.stringify(b);
    } catch (e) {}
    return "";
}

function execute() {
    var out = [];

    // Buoc 1: muc luc qua GET.
    try {
        var toc = getJson(BASE_URL + "/api/chapters/115146", 20000);
        if (toc.ok) {
            var chs = (toc.json && toc.json.chapters) || [];
            var un = 0, i = 0;
            for (i = 0; i < chs.length; i++) { if (!chs[i].locked) un++; }
            var c1 = chs.length > 0 ? chs[0] : null;
            out.push("TOC: count=" + chs.length + " unlocked=" + un +
                " ch1=" + (c1 ? (c1.id + " order=" + c1.order + " locked=" + c1.locked + " title=[" + c1.title + "]") : "none"));
        } else {
            out.push("TOC: FAIL status=" + toc.status + " err=" + toc.error);
        }
    } catch (e) { out.push("TOC: ERR " + e); }

    // Buoc 2: POST reader/get dich vu ai.
    var contentUrl = "";
    try {
        var rr = postJson(BASE_URL + "/api/reader/get", {
            translate: "ai", language: "en", raw_id: 115146,
            chapter_no: 1, chapter_id: 58283374, retry: false, force_retry: false
        }, 20000);
        if (!rr.ok) {
            out.push("READER-AI: FAIL status=" + rr.status + " err=" + rr.error);
        } else {
            var j = rr.json;
            var bt = bodyTextOf(j);
            if (j && j.content_url) contentUrl = String(j.content_url);
            out.push("READER-AI: success=" + (j && j.success) +
                " requireTurnstile=" + (j && j.requireTurnstile) +
                " code=" + (j && j.code) + " error=" + (j && j.error) +
                " content_url=" + (contentUrl ? "YES " + contentUrl.substring(0, 80) : "NO") +
                " bodyLen=" + bt.length +
                (bt.length > 0 ? " sample=[" + bt.replace(/<[^>]+>/g, " ").substring(0, 200) + "]" : ""));
        }
    } catch (e) { out.push("READER-AI: ERR " + e); }

    // Buoc 3: GET content_url neu co.
    if (contentUrl) {
        try {
            var cu = contentUrl;
            if (cu.indexOf("http") !== 0) cu = BASE_URL + (cu.charAt(0) === "/" ? "" : "/") + cu;
            var cr = getJson(cu, 20000);
            if (!cr.ok) {
                out.push("CONTENT-URL: FAIL status=" + cr.status + " err=" + cr.error);
            } else {
                var cj = cr.json;
                var cd = (cj && cj.data) || cj;
                var cb = "";
                if (cd && typeof cd.body === "string") cb = cd.body;
                else if (typeof cd === "string") cb = cd;
                else cb = JSON.stringify(cd || "").substring(0, 500);
                out.push("CONTENT-URL: ok bodyLen=" + cb.length +
                    (cb.length > 0 ? " sample=[" + cb.replace(/<[^>]+>/g, " ").substring(0, 200) + "]" : ""));
            }
        } catch (e) { out.push("CONTENT-URL: ERR " + e); }
    }

    // Buoc 4: POST search.
    try {
        var sr = postJson(BASE_URL + "/api/search", { text: "Going Back" }, 20000);
        if (!sr.ok) {
            out.push("SEARCH: FAIL status=" + sr.status + " err=" + sr.error);
        } else {
            var sd = (sr.json && sr.json.data) || [];
            var names = [];
            for (var i = 0; i < sd.length && i < 3; i++) {
                var t = sd[i] && (sd[i].title || (sd[i].data && sd[i].data.title) || (sd[i].serie_data && sd[i].serie_data.data && sd[i].serie_data.data.title));
                if (t) names.push(t);
            }
            out.push("SEARCH: success=" + (sr.json && sr.json.success) + " count=" + sd.length + " sample=[" + names.join(" | ") + "]");
        }
    } catch (e) { out.push("SEARCH: ERR " + e); }

    // Buoc 5: WebView du phong — mo trang chuong, poll .chapter-body.
    try {
        var b = Engine.newBrowser();
        try {
            b.launch(BASE_URL + "/en/novel/115146/going-back-to-98-starting-with-breaking-off-an-engagement-to-achieve-financial-freedom/chapter-1", 15000);
            var found = 0;
            var sample = "";
            var turnstile = false;
            var ti = "";
            for (var t = 0; t < 14; t++) {
                sleep(1000);
                var doc = b.html(6000);
                ti = String(doc.select("title").text() || "");
                var body = String(doc.select(".chapter-body").text() || "");
                var all = String(doc.select("body").text() || "");
                if (all.indexOf("Turnstile") >= 0 || all.indexOf("Verify you are human") >= 0) turnstile = true;
                if (body.length >= 500) { found = body.length; sample = body.substring(0, 200); break; }
                if (t === 13) { found = body.length; sample = body.substring(0, 200); }
            }
            out.push("WEBVIEW: title=[" + ti + "] bodyLen=" + found + " turnstile=" + turnstile +
                (found > 0 ? " sample=[" + sample + "]" : ""));
        } catch (e2) { out.push("WEBVIEW: ERR " + e2); }
        finally { b.close(); }
    } catch (e3) { out.push("WEBVIEW: ERR " + e3); }

    return Response.success(out.join(" | "));
}
