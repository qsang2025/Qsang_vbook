// chap.js — Noi dung chuong trong #booktxt.
//
// Chuong dai tach thanh <id>_2.html, <id>_3.html... (tieu de h1.bookname
// kem "(N/M)"); ghep cac trang lai cho den khi #next khong tro ve cung
// chuong nua. Cat bo doan "本章未完，点击下一页继续阅读。" o cuoi trang
// giua va "(本章完)" o cuoi chuong.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/([A-Za-z0-9]+)\.html$/);
    var chapId = m ? m[1] : "";

    var content = "";
    var title = "";
    var next = url;
    for (var i = 0; i < 20 && next; i++) {
        var rr = ttlFetchDoc(next);
        if (rr.error) {
            if (i === 0) return Response.error(rr.error);
            break;
        }
        var doc = rr.doc;
        if (i === 0) {
            title = cleanText(doc.select("h1.bookname").text()).replace(/（\d+\/\d+）\s*$/, "");
        }
        var body = doc.select("#booktxt");
        if (body.isEmpty()) {
            if (i === 0) return Response.error("Không đọc được nội dung chương");
            break;
        }
        body.select("script, div").remove();
        var ps = body.select("p");
        for (var j = 0; j < ps.size(); j++) {
            var p = ps.get(j);
            var t = cleanText(p.text());
            if (t === "本章未完，点击下一页继续阅读。" || t === "(本章完)") p.remove();
        }
        content += body.html();

        // Trang tiep theo cua cung chuong co dang /{chapId}_N.html.
        var nextEl = selFirst(doc, "#next");
        var nextHref = nextEl ? nextEl.attr("href") : "";
        next = (chapId && nextHref && nextHref.indexOf("/" + chapId + "_") !== -1) ? absUrl(nextHref) : "";
    }
    if (!cleanText(content.replace(/<[^>]+>/g, ""))) return Response.error("Nội dung chương trống");
    return Response.success(content, title);
}
