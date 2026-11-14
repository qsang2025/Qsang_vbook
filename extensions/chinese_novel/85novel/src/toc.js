// toc.js — Muc luc truyen (execute(url) -> danh sach chuong).
//
// Trang chi tiet CHI co 1 link chuong (moi nhat) nen muc luc BAT BUOC
// qua API cua site (kiem chung cau truc 2026-11-14; POST API treo tu
// IP datacenter cua VM — tarpit — chi chay tren may that):
//   1. GET trang chi tiet -> token Login(..., '<token>') (doi moi lan
//      tai) + cookie phien tu response.
//   2. POST <url>?_xsrf=<token> {action:"auth"} -> tong so chuong.
//   3. POST {action:"chapters", slice:[start,end]} (200/slice, cach
//      nhau 3 giay) -> [{ChapterName, ChapterUrl, ...}].
// Neu API hong -> fallback parse link chuong trong HTML trang chi tiet
// (thuong chi co chuong moi nhat) -> neu van rong thi bao loi tieng Viet.
// Khong co page.js: toc.js tu lap slice trong 1 lan goi.
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

var TOC_PAGE_SIZE = 200;
var TOC_SLICE_DELAY_MS = 3000;

function execute(url) {
    url = normalizeInput(url);
    var t = fetch85Text(url, {});
    if (!t.ok) {
        if (t.status === 429 || t.status === 405) {
            try { setCooldown(SITE_HOST, 60 * 60 * 1000); } catch (e) {}
            return Response.error(rateLimitErrorMessage("85 Novel", SITE_HOST, 0));
        }
        return Response.error("Không tải được trang truyện từ 85 Novel (HTTP " + t.status + ").");
    }
    var html = t.text || "";
    var cookie = requestCookie(t.res);
    var token = extractXsrfToken(html);
    var chapters = [];
    var seen = {};
    if (token) {
        sleep85(TOC_SLICE_DELAY_MS);
        var total = fetchChapterTotal(url, token, cookie);
        if (total > 0) {
            var start = 1;
            for (start = 1; start <= total; start += TOC_PAGE_SIZE) {
                if (start > 1) sleep85(TOC_SLICE_DELAY_MS);
                var end = start + TOC_PAGE_SIZE - 1;
                if (end > total) end = total;
                var list = fetchChapterSlice(url, token, cookie, [start, end]);
                var k = 0;
                for (k = 0; k < list.length; k++) {
                    pushChapter(chapters, seen, list[k]);
                }
                if (list.length < TOC_PAGE_SIZE) break;
            }
        }
    }
    if (!chapters.length) {
        var doc = null;
        try {
            doc = Html.parse(html);
        } catch (e) {
            doc = null;
        }
        if (doc) parseHtmlChapters(doc, chapters, seen);
    }
    if (!chapters.length) {
        return Response.error("Không lấy được mục lục của truyện này từ 85 Novel. Trang chi tiết không liệt kê chương, API mục lục không trả về dữ liệu — vui lòng thử lại sau.");
    }
    return Response.success(chapters);
}

function apiHeaders(url, cookie) {
    var h = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": url
    };
    if (cookie) h["Cookie"] = cookie;
    return h;
}

function fetchChapterTotal(url, token, cookie) {
    var res = null;
    try {
        res = fetch(url + "?_xsrf=" + encodeURIComponent(token), {
            method: "POST",
            headers: apiHeaders(url, cookie),
            body: JSON.stringify({ action: "auth" })
        });
    } catch (e) {
        return 0;
    }
    if (!res || !res.ok) return 0;
    var text = "";
    try { text = res.text() || ""; } catch (e2) { return 0; }
    var data = null;
    try { data = JSON.parse(text); } catch (e3) { return 0; }
    if (!data || !data.result) return 0;
    var n = parseInt(data.result.chapters, 10);
    return isNaN(n) ? 0 : n;
}

function fetchChapterSlice(url, token, cookie, slice) {
    var res = null;
    try {
        res = fetch(url + "?_xsrf=" + encodeURIComponent(token), {
            method: "POST",
            headers: apiHeaders(url, cookie),
            body: JSON.stringify({ action: "chapters", slice: slice })
        });
    } catch (e) {
        return [];
    }
    if (!res || !res.ok) return [];
    var text = "";
    try { text = res.text() || ""; } catch (e2) { return []; }
    var data = null;
    try { data = JSON.parse(text); } catch (e3) { return []; }
    if (!data || !data.result || !data.result.chapters) return [];
    return data.result.chapters;
}

function pushChapter(chapters, seen, ch) {
    if (!ch) return;
    var name = cleanText(ch.ChapterName || ch.name || "");
    var href = ch.ChapterUrl || ch.url || "";
    if (!name || !href) return;
    var key = String(href);
    if (key.indexOf("/book/") === 0) key = key.substring(6);
    else if (key.indexOf("book/") === 0) key = key.substring(5);
    if (seen[key]) return;
    seen[key] = true;
    var item = { name: name, url: absUrl("/book/" + key), host: BASE_URL };
    if (isPaidChapter(ch)) {
        item.pay = true;
        item.lock = true;
    }
    chapters.push(item);
}

// Danh dau chuong tra phi/khoa neu API tra co co tuong ung. Ten truong
// that se xac nhan tu JSON that tren may that — day la phong thu.
function isPaidChapter(ch) {
    var keys = ["IsVip", "isVip", "vip", "Vip", "pay", "Pay", "locked", "Locked", "isLocked", "needPay", "NeedPay"];
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        var v = ch[keys[i]];
        if (v === true || v === 1 || v === "1" || v === "true") return true;
    }
    return false;
}

// Fallback: link chuong trong HTML trang chi tiet (thuong chi co chuong
// moi nhat). Base cu dung regex ^\d+\/\d+\.html$ — sai voi href tuyet
// doi /book/<id>/<n>.html nen khong bao gio khop; da sua.
function parseHtmlChapters(doc, chapters, seen) {
    var links = doc.select("a[href*='.html']");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.text());
        if (!name || !href) continue;
        if (!/\/book\/\d+\/\d+\.html$/.test(href)) continue;
        pushChapter(chapters, seen, { ChapterName: name, ChapterUrl: href });
    }
}
