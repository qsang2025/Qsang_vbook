// chap.js — uu看書 (uuread.tw): doc chuong, di theo link "下一頁" neu
// chuong chia nhieu trang.
// Port tu alexsonxxx v1; sua quirk .first() (xem file safe-first.js:
// first() khong bao gio tra null tren may that) va them pacing +
// phat hien trang challenge Cloudflare (xem file config.js).
load('config.js');
load('rate-limit.js');
load('safe-first.js');
load('challenge-handler.js');

function execute(url) {
    url = normalizeUrl(url);
    if (url.indexOf("http") !== 0) {
        url = BASE_URL + url;
    }
    var html = "";
    var title = "";
    var u = url;
    var guard = 0;
    while (guard < 5) {
        guard++;
        var r = fetchDoc(u);
        if (!r.ok) return Response.error(httpError(u, r.status, r.challenge, r.cooldownMs));
        var doc = r.doc;
        if (guard === 1) {
            var t = safeFirst(doc.select(".chatit"));
            if (t) {
                title = t.text().replace(/[（(]\s*\d+\s*\/\s*\d+\s*[)）]\s*$/, "").trim();
            }
        }
        doc.select("#nr script").remove();
        var nr = safeFirst(doc.select("#nr"));
        if (nr) {
            html += nr.html().replace(/&nbsp;/g, " ");
        }
        var next = "";
        doc.select(".operate a").forEach(function (a) {
            var txt = a.text().replace(/\s/g, "");
            if (txt === "下一頁" || txt === "下一页") {
                var href = a.attr("href");
                if (href && href.indexOf("http") !== 0) href = BASE_URL + href;
                next = href;
            }
        });
        if (!next) break;
        u = next;
    }
    if (!html) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(html, title);
}
