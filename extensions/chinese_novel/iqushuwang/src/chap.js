// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong /read/<cum>/<id>/<chapterid>.html (kiem chung live
// 2026-11-16):
// - Noi dung: div#novelcontent — CO SAN trong HTML tinh, fetch truc
//   tiep du (khong can WebView). Cuoi div co 2 the p thua can cat:
//   "《书名》 第N章 ...（第x/y页）" va "本章未完，点击下一页继续阅读。".
// - Tieu de: h2 "第N章 标题（第x/y页）" (h1 la ten truyen, khong dung).
// - Chuong phan trang: <id>.html = trang 1, <id>_1.html = trang 2...
//   Link "下一章" trong .page_chapter tro toi trang ke CUA CUNG CHUONG
//   (dang _<n>.html); chi noi tiep khi link khop dang _<n>.html —
//   trang cuoi cua chuong co link dang khac (chuong sau) thi DUNG.
// - Sach mau 1389: ch.1 568 + 578 ky tu; ch.2 679 ky tu/trang 1;
//   ch.76 697 ky tu/trang 1. Van xuoi that.
// Tra Response.success(html, tieu de chuong).
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

// Cat cac the p thua cuoi div#novelcontent: dong "《书名》 第N章..."
// va dong "本章未完，点击下一页继续阅读。" (hoac "本章完").
function trimChapterFooter(contentEl) {
    var ps = contentEl.select("p");
    for (var i = 0; i < ps.size(); i++) {
        var p = ps.get(i);
        var t = cleanText(p.text());
        if (!t) continue;
        if (t.charAt(0) === "《" || t.indexOf("点击下一页继续阅读") !== -1 || t.indexOf("本章未完") !== -1) {
            p.remove();
        }
    }
}

function fetchChapterPage(url) {
    var r = fetchIqDoc(url);
    if (r.error) return { error: r.error };
    var doc = r.doc;
    var bodyText = String(doc.select("body").text() || "");
    if (bodyText.indexOf("请先登录") !== -1 || bodyText.indexOf("VIP章节") !== -1) {
        return { error: "Chương này yêu cầu đăng nhập hoặc trả phí nên không đọc được miễn phí." };
    }
    var contentEl = safeFirst(doc.select("#novelcontent"));
    if (contentEl === null) return { error: "Không đọc được nội dung chương." };
    trimChapterFooter(contentEl);
    var html = String(contentEl.html() || "").trim();
    if (!html) return { error: "Không đọc được nội dung chương." };
    var nextPage = "";
    var navs = doc.select(".page_chapter a[href*=\"_\"], .page_chapter a[href*=\"/read/\"]");
    for (var i = 0; i < navs.size(); i++) {
        var h = String(navs.get(i).attr("href") || "");
        if (/\/\d+_\d+\.html$/.test(h)) { nextPage = normalizeIqUrl(h); break; }
    }
    var title = "";
    var h2El = safeFirst(doc.select("h2"));
    if (h2El !== null) {
        title = cleanText(h2El.text()).replace(/（第\d+\/\d+页）/g, "").replace(/\(第\d+\/\d+页\)/g, "").trim();
    }
    if (!title) {
        var ti = String(doc.select("title").text() || "");
        title = cleanText(ti.split("_")[0]).replace(/第\d+页$/, "").trim();
    }
    return { html: html, nextPage: nextPage, title: title };
}

function execute(url) {
    url = normalizeIqUrl(url);
    if (!url) return Response.error("Đường dẫn chương không hợp lệ.");
    var first = fetchChapterPage(url);
    if (first.error) return Response.error(first.error);

    var html = first.html;
    var title = first.title;
    var next = first.nextPage;
    var pages = 1;
    while (next && pages < 10) {
        var one = fetchChapterPage(next);
        if (one.error) break;
        html += "<br><br>" + one.html;
        next = one.nextPage;
        pages++;
    }
    var plain = stripTags(html).replace(/\s+/g, " ").trim();
    if (plain.length < 50) return Response.error("Không đọc được nội dung chương.");
    return Response.success(html, title);
}
