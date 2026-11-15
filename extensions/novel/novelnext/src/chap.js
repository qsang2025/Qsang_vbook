// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Trang chuong /novelnext/<slug>/chapter-<n> (DA Kiem chung tu VM
// 2026-11-15 ~22:0x: #chr-content chua 134 <p>, mo dau "Welcome... zi...
// watch Donghai News tonight... zi... today is August 8th...", ket
// "(End of this chapter)", khong quang cao ben trong. h2 la ten chuong,
// h1 la ten truyen. Luu y: Cloudflare tra 429 cho duong /chapter- tu
// IP datacenter theo dot (chan tu 2026-11-15 ~14:44, mo lai trong luc
// chay harness ~22:0x) — pacedFetch tu retry/backoff toi da 3 lan.
// Cascade phong thu giu nguyen de phong site doi giao dien:
//   #chapter-content -> .chapter-content -> #content ->
//   #chr-content -> .reading-content -> div co nhieu <p> nhat.
// Chuong 1 trang duy nhat (khong chia trang — ch.1 ve trong 1 fetch).
// Ten chuong lay tu h2, fallback h1 roi <title> (bo hau to sau " | ").
// Doan quang cao (patreon/discord) va dieu huong Previous/Next Chapter
// bi cat bo. Dung absUrl() thay cho normalizeUrl(): normalizeUrl()
// khong xu ly URL chi co path — fetch nhan URL tuong doi thi tra
// fake 504 (bai hoc biqugezz 2026-11-15).
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

// Doan chi chua quang cao / dieu huong (khong phai noi dung truyen)?
function isJunkText(text) {
    var t = text || "";
    if (t.indexOf("patreon.com") !== -1) return true;
    if (t.indexOf("discord.gg") !== -1) return true;
    if (t.indexOf("Join my Discord") !== -1) return true;
    if (t.indexOf("Previous Chapter") !== -1) return true;
    if (t.indexOf("Next Chapter") !== -1) return true;
    if (t.indexOf("Report chapter error") !== -1) return true;
    return false;
}

// Tim container noi dung chuong bang cascade selector.
function findContentEl(doc) {
    var selectors = ["#chapter-content", ".chapter-content", "#content", "#chr-content", ".reading-content"];
    var i = 0;
    for (i = 0; i < selectors.length; i++) {
        var el = safeFirst(doc.select(selectors[i]));
        if (el !== null && el.select("p").size() > 0) return el;
    }
    // Fallback: div co nhieu <p> nhat (toi thieu 5 doan).
    var best = null;
    var bestCount = 0;
    var divs = doc.select("div");
    for (i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var n = d.select("p").size();
        if (n > bestCount) {
            bestCount = n;
            best = d;
        }
    }
    if (best !== null && bestCount >= 5) return best;
    return null;
}

function execute(url) {
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    var r = fetchNnDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = findContentEl(doc);
    if (contentEl === null) {
        return Response.error("Không tìm thấy nội dung chương (site có thể đã đổi giao diện): " + chapUrl);
    }
    // Xoa khoi rac trong container truoc khi lay <p>.
    contentEl.select("script, style, iframe, ins, .ads, [class*=\"ad-\"]").remove();
    var paras = contentEl.select("p");
    if (paras.size() === 0) {
        return Response.error("Chương này không có nội dung.");
    }
    var html = "";
    var i = 0;
    for (i = 0; i < paras.size(); i++) {
        var inner = paras.get(i).html() || "";
        var text = cleanText(inner.replace(/<[^>]+>/g, " "));
        if (!text) continue;
        if (isJunkText(text)) continue;
        html = html + "<p>" + inner + "</p>";
    }
    if (!cleanText(html.replace(/<[^>]+>/g, " "))) {
        return Response.error("Chương này không có nội dung.");
    }

    // Tieu de chuong: h2 la ten chuong ("Chapter 1 ..."), h1 la TEN TRUYEN
    // (dung h1 se sai). title tag dang "Chuong | Read <truyen>".
    var title = "";
    var h2 = safeFirst(doc.select("h2"));
    if (h2 !== null) title = cleanText(h2.text());
    if (!title) {
        var h1 = safeFirst(doc.select("h1"));
        if (h1 !== null) title = cleanText(h1.text());
    }
    if (!title) {
        var t = safeFirst(doc.select("title"));
        if (t !== null) {
            title = cleanText(t.text());
            var bar = title.indexOf(" | ");
            if (bar > 0) title = title.substring(0, bar);
            else {
                var dash = title.indexOf(" - ");
                if (dash > 0) title = title.substring(0, dash);
            }
        }
    }
    return Response.success(html, title);
}
