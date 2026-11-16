// toc.js — Muc luc 1 trang (execute(url) -> [chuong]).
//
// Hai dang trang muc luc (kiem chung live 2026-11-16):
// - Trang chi tiet /book/<id>/ = trang 1: lay khoi .info_chapters thu
//   hai (header chua "目录", 20 link chuong); khoi dau la "最新章节"
//   (4 chuong moi nhat) — KHONG lay.
// - Trang /book/<id>/<n>/ (n >= 1): lay tat ca link /read/ tru "开始阅读".
// Link chuong lay NGUYEN tu TOC (vd. /read/1/1389/277903.html — so "1"
//   la cum/volume, khong tu suy ra). Ten chuong = text cua link.
// page.js tra danh sach cac trang muc luc; toc.js chay 1 lan/trang.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeIqUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchIqDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    var blocks = doc.select(".info_chapters");
    var target = null;
    var bi = 0;
    for (bi = 0; bi < blocks.size(); bi++) {
        var b = blocks.get(bi);
        var hdr = String(b.select("p.p1").text() || "");
        if (hdr.indexOf("目录") !== -1) { target = b; break; }
    }
    var links = null;
    if (target !== null) {
        links = target.select("a[href*=\"/read/\"]");
    } else {
        links = doc.select("a[href*=\"/read/\"]");
    }
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = cleanText(a.text());
        if (!name || name === "开始阅读") continue;
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var curl = normalizeIqUrl(href);
        if (!curl) continue;
        if (seen[curl]) continue;
        seen[curl] = 1;
        items.push({ name: name, url: curl });
    }
    if (items.length === 0) return Response.error("Không đọc được mục lục.");
    return Response.success(items);
}
