// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, host}]).
//
// Muc luc nam tren trang /read_<id>/, trong #list > dl:
//   <dt>《书名》的结局 (chuong moi nhat, giam dan + lan muc phu:
//        新书已发 (quang ba), 完本感言)</dt>
//   <dd>... (khoang 12 muc moi nhat, giam dan)</dd>
//   <dt>《书名》正文</dt>
//   <dd>... (toan bo chuong, TANG DAN: 第一章 ... 大结局, 完本感言)</dd>
// Lay cac dd SAU dt chua "正文" — vua du, vua dung thu tu tang dan.
// Fallback (neu site doi template, mat dt 正文): lay het dd, khu trung
// theo URL, dao nguoc neu thu tu giam dan (so cid dau > cid cuoi).
// Chap nhan ca URL trang truyen (/new_<id>.html) lan URL muc luc
// (/read_<id>/) va host m.shushuwuxs.com (doi ve www).
// Muc luc KHONG phan trang (1 trang duy nhat) nen khong can page.js.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

// /new_<id>.html -> /read_<id>/; m. -> www.
function resolveTocUrl(url) {
    var u = normalizeUrl(url);
    var m = u.match(/\/new_(\d+)\.html$/);
    if (m) return siteOrigin() + "/read_" + m[1] + "/";
    return u;
}

function chapterId(link) {
    var m = String(link || "").match(/\/(\d+)\.html$/);
    return m ? parseInt(m[1], 10) : 0;
}

function execute(url) {
    var target = resolveTocUrl(url);
    rateLimitDelay("shushuwuxs.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được mục lục: " + target);

    var chapters = [];
    var seen = {};
    var i = 0;

    // Duyet con cua dl theo thu tu tai lieu: bat dau lay tu sau dt 正文.
    var dl = doc.select("#list dl").first();
    if (dl === null) dl = doc.select("dl").first();
    if (dl !== null) {
        var kids = dl.children();
        var inMain = false;
        var sawZhengwen = false;
        for (i = 0; i < kids.size(); i++) {
            var kid = kids.get(i);
            var tag = String(kid.tagName() || "").toLowerCase();
            if (tag === "dt") {
                if (cleanText(kid.text()).indexOf("正文") !== -1) {
                    inMain = true;
                    sawZhengwen = true;
                }
                continue;
            }
            if (tag !== "dd") continue;
            if (!inMain) continue;
            var a = kid.select("a").first();
            if (a === null) continue;
            var href = String(a.attr("href") || "");
            if (!href) continue;
            var name = cleanText(a.text());
            if (!name) continue;
            var link = absUrl(href);
            if (seen[link]) continue;
            seen[link] = true;
            chapters.push({
                name: name,
                url: link,
                host: siteOrigin(),
                description: "",
                lock: false,
                pay: false
            });
        }

        // Fallback: khong thay dt 正文 — lay het dd, khu trung, dao neu giam dan.
        if (!sawZhengwen) {
            chapters = [];
            seen = {};
            var allDd = dl.select("dd");
            for (i = 0; i < allDd.size(); i++) {
                var a2 = allDd.get(i).select("a").first();
                if (a2 === null) continue;
                var href2 = String(a2.attr("href") || "");
                if (!href2) continue;
                var name2 = cleanText(a2.text());
                if (!name2) continue;
                var link2 = absUrl(href2);
                if (seen[link2]) continue;
                seen[link2] = true;
                chapters.push({
                    name: name2,
                    url: link2,
                    host: siteOrigin(),
                    description: "",
                    lock: false,
                    pay: false
                });
            }
            if (chapters.length > 1) {
                var firstId = chapterId(chapters[0].url);
                var lastId = chapterId(chapters[chapters.length - 1].url);
                if (firstId > lastId) chapters.reverse();
            }
        }
    }

    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + target);
    }
    return Response.success(chapters);
}
