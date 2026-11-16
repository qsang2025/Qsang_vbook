// probe5.js — TAM THOI: kiem tra /reader? (khong slash) + link "Truy cập với tư cách khách" tren trang login.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
var STORY_ID = "b54d3a11-56f0-481d-b614-3a57a40cbb1a";
var CHAP1_ID = "0f8519ff-100b-4430-9f51-0903f1e83b11";
function execute() {
    var out = [];
    try {
        var r = pacedFetch(BASE_URL + "/reader?storyId=" + STORY_ID + "&chapter=" + CHAP1_ID, { method: "GET", timeout: 20000, maxRetries: 0 });
        if (!r.ok || !r.res) { out.push("READER-NOSLASH: FAIL status=" + r.status); }
        else {
            var d = r.res.html();
            var bt = "";
            try { bt = String(d.select("body").text() || ""); } catch (e) {}
            var guest = "";
            try {
                var links = d.select("a");
                var i = 0;
                for (i = 0; i < links.size(); i++) {
                    var t = String(links.get(i).text() || "");
                    if (t.indexOf("khách") !== -1) guest = String(links.get(i).attr("href") || "") + " {" + t + "}";
                }
                var btns = d.select("button");
                for (i = 0; i < btns.size(); i++) {
                    var bt2 = String(btns.get(i).text() || "");
                    if (bt2.indexOf("khách") !== -1) guest += " BUTTON[" + bt2 + "]";
                }
            } catch (e2) {}
            out.push("READER-NOSLASH: status=" + r.status + " title=[" + (function(){ try { return String(d.select("title").first().text() || ""); } catch(e3){ return ""; } })() + "] bodyLen=" + bt.length + " guest=[" + guest + "]");
        }
    } catch (e) { out.push("READER-NOSLASH: ERR " + e); }
    out.push("PROBE5-DONE");
    return Response.success(out.join(" | "));
}
