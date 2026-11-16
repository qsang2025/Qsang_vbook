// chap.js — Noi dung chuong (execute(url) -> html, tieu de).
//
// Trang /xs/<id>/zj/<cid> (kiem chung live 2026-11-16):
// - Tieu de: h1 (dang "<ten> (N/M)" khi chuong chia trang — cat bo
//   hau to (N/M)).
// - Noi dung: #booktxt (the p). Chuong chia nhieu trang (?page=N):
//   theo link 下一页 trong .bottem1, toi da 10 trang.
// - Cat bo: script, ins, #play, .report, p[style*="color:red"],
//   va khoi quang cao cuoi chuong (bat dau tu cau
//   "爱寻书为广大书友们提供" tro di).
// - LUU Y: mot so sach cu (vi du 乐可, 2022) bi dao doan van o phia
//   server, khong co co che sap xep lai (kiem chung: giong nhau o ca
//   2 UA, 2 lan tai, khong co JS sap xep) — chap.js tra dung nhung gi
//   site tra; da so sach khac doc dung thu tu (xem IXUNSHU-PROGRESS.md §3).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function cleanChapterDoc(doc) {
    doc.select("script").remove();
    doc.select("ins").remove();
    doc.select("#play").remove();
    doc.select(".report").remove();
    doc.select("p[style*=\"color:red;\"]").remove();
    var box = safeFirst(doc.select("#booktxt"));
    if (box === null) return null;
    var ps = box.select("p");
    var parts = [];
    var stop = false;
    for (var i = 0; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (!t) continue;
        if (t.indexOf("爱寻书为广大书友们提供") !== -1) { stop = true; break; }
        if (stop) break;
        parts.push("<p>" + t + "</p>");
    }
    return parts.join("");
}

function execute(url) {
    var target = normalizeIxUrl(url);
    if (!target) return Response.error("Đường dẫn chương không hợp lệ.");
    var title = "";
    var html = "";
    var next = target;
    var seen = {};
    for (var page = 0; page < 10 && next; page++) {
        if (seen[next]) break;
        seen[next] = 1;
        var r = fetchIxDoc(next);
        if (r.error) {
            if (page === 0) return Response.error(r.error);
            break;
        }
        var doc = r.doc;
        if (page === 0) {
            var h1 = safeFirst(doc.select("h1"));
            if (h1 !== null) {
                title = cleanText(h1.text()).replace(/\s*（\d+\/\d+）\s*$/, "");
            }
        }
        var part = cleanChapterDoc(doc);
        if (part === null) {
            if (page === 0) return Response.error("Không đọc được nội dung chương.");
            break;
        }
        html += part;
        var nextUrl = "";
        var bot = doc.select(".bottem1 a");
        for (var i = 0; i < bot.size(); i++) {
            var a = bot.get(i);
            var at = cleanText(a.text());
            var ah = String(a.attr("href") || "");
            if (at === "下一页" && ah.indexOf("page=") !== -1) {
                nextUrl = absUrl(ah);
                break;
            }
        }
        next = nextUrl;
    }
    if (!html) return Response.error("Không đọc được nội dung chương.");
    return Response.success(html, title);
}
