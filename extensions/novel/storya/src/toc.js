// toc.js — muc luc day du mot truyen (execute(url) -> [{name, url}]).
//
// Trang chi tiet liet ke ~100 chuong/trang, phan trang bang
// ?cpage=N#chapters (link a[rel="next"]); ?order=asc cho thu tu tang
// dan (chuong 1 truoc) va link next giu nguyen order=asc.
// Moi dong chuong: link a[href="/vi/stories/<slug>/<chapter-slug>"]
//   span[0] so chuong ("1296") + span[1] ten chuong ("ba đao dư một")
//   => ten muc luc "Chương 1296: ba đao dư một".
// Can bo trung theo slug (nut "Đọc từ đầu" trung link chuong 1) va bo
// feed.xml; bo nut dieu huong ("Đọc từ đầu", "Chương mới nhất").
// Toi da 100 trang (du cho truyen dai nhat hien tai ~1391 chuong).
//
// Tai len: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var slug = extractSlug(url);
    if (!slug) return Response.error("URL không hợp lệ: " + url);

    var chapters = [];
    var seen = {};
    var pagePath = "/vi/stories/" + slug + "?order=asc";

    for (var page = 0; page < 100; page++) {
        var r = fetchStoryaDoc(toSiteUrl(pagePath));
        if (r.error) return Response.error(r.error);
        var doc = r.doc;

        var prefix = "/vi/stories/" + slug + "/";
        var links = doc.select('a[href*="' + prefix + '"]');
        for (var i = 0; i < links.size(); i++) {
            var link = links.get(i);
            var href = String(link.attr("href") || "");
            if (href.indexOf(prefix) !== 0) continue;
            var chapterSlug = href.substring(prefix.length).split(/[?#]/)[0];
            if (!chapterSlug || chapterSlug.indexOf("/") >= 0 || /\.xml$/i.test(chapterSlug) || seen[chapterSlug]) continue;

            var spans = link.select("span");
            var num = spans.size() > 0 ? cleanText(spans.get(0).text()) : "";
            // Chi nhan dong chuong chinh: span dau tien phai la so chuong
            // thuan ("1296"). Trang chi tiet con co dai "chuong moi nhat"
            // o dau trang: cac link o do khong co span so (span dau la ten
            // chuong, span sau la luot doc) — neu nhan thi ten chuong sai
            // ("Chương <ten>: <luot doc>") va lan trung slug se day mat
            // dong chinh dung ten o duoi (loi gap 2026-11-13).
            if (!/^\d+$/.test(num)) continue;
            var ctitle = spans.size() > 1 ? cleanText(spans.get(1).text()) : "";
            var title = ctitle ? "Chương " + num + ": " + ctitle : "Chương " + num;
            if (/^(Đọc từ đầu|Chương mới nhất)$/i.test(title.trim())) continue;
            if (!title) title = "Chương " + (chapters.length + 1);
            seen[chapterSlug] = true;
            chapters.push({
                name: title,
                url: toSiteUrl(href.split(/[?#]/)[0]),
                host: BASE_URL
            });
        }

        var next = safeFirst(doc.select('a[rel="next"]'));
        if (!next) break;
        var nextHref = String(next.attr("href") || "");
        if (!nextHref) break;
        pagePath = nextHref.split("#")[0];
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục của truyện này");
    return Response.success(chapters);
}
