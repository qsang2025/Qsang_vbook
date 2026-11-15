// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Noi dung o #chaptercontent, cac doan la <p> (kiem chung live
// 2026-11-15). Chuong chia trang kieu _2.html qua a#pt_next chu
// "下一页" — noi them trang ke (ch.1 万族之劫: 2 trang, tong ~3425 ky
// tu, mo dau "安平历350年。大夏府，南元城。苏家。…"). Trang cuoi co
// a#pt_next chu "下一章" (link chuong ke) nen vong lap chi noi khi
// chu la "下一页". Phong thu toi da 10 trang.
// Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// Ten chuong lay tu <title> dang "第1章 父子_万族之劫(1 / 2)_抖音小说-笔趣阁".
// Dung absUrl() thay cho normalizeUrl(): normalizeUrl() khong xu ly
// URL chi co path (vd "/bqg/223080/101387016.html") — no tra nguyen
// chuoi, fetch nhan URL tuong doi thi tra fake 504 (bai hoc biqugezz
// 2026-11-15).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function readChapterContent(doc) {
    var contentEl = safeFirst(doc.select("#chaptercontent"));
    if (contentEl === null) return null;
    var html = contentEl.html() || "";
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p>\s*<\/p>/g, "");
    return html;
}

function execute(url) {
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    var r = fetchDyDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var content = readChapterContent(doc);
    if (content === null) {
        var fullText = cleanText(doc.text()).toLowerCase();
        if (fullText.indexOf("登录") !== -1 || fullText.indexOf("登入") !== -1) {
            return Response.error("Chương này có thể yêu cầu đăng nhập.");
        }
        return Response.error("Không tìm thấy nội dung chương.");
    }

    var n = 0;
    while (n < 10) {
        var nextLink = null;
        var navs = doc.select("a#pt_next");
        var j = 0;
        for (j = 0; j < navs.size(); j++) {
            var a = navs.get(j);
            if (cleanText(a.text()) === "下一页") {
                nextLink = a.attr("href") || "";
                break;
            }
        }
        if (!nextLink) break;
        var nextUrl = absUrl(nextLink);
        if (!nextUrl) break;
        var r2 = fetchDyDoc(nextUrl);
        if (r2.error) break;
        var extra = readChapterContent(r2.doc);
        if (extra === null || !cleanText(extra)) break;
        content = content + extra;
        doc = r2.doc;
        n = n + 1;
    }

    if (!cleanText(content)) return Response.error("Không tìm thấy nội dung chương.");

    var title = "";
    try {
        var t = cleanText(doc.select("title").text());
        var parts = t.split("_");
        if (parts.length >= 1) title = parts[0];
        else title = t;
    } catch (e) {
    }
    return Response.success(content, title);
}
