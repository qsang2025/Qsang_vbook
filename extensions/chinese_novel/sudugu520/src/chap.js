// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Trang chuong /<id>/<chapid>.html (kiem chung live 2026-11-15):
// - Noi dung trong div.con, cac <p> (khong quang cao ben trong).
// - Tieu de chuong trong h1 dang "Ten truyen > Ten chuong" — lay phan
//   sau dau " > " (vd "第1章 转世（元旦快乐！）").
// - Chuong CHIA NHIEU TRANG: link "下一页" toi -2.html, -3.html,
//   -4.html... (ch.1 苟在两界修仙 co 4 trang, tong ~3.476 ky tu;
//   rescan #10 noi 2 trang la thieu). Ghep tat ca trang chia cho toi
//   khi het link 下一页 (toi da 10 trang phong lap vo han).
// - Dung absUrl() thay cho normalizeUrl(): normalizeUrl() khong xu ly
//   URL chi co path — fetch nhan URL tuong doi thi tra fake 504
//   (bai hoc biqugezz 2026-11-15).
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

// Lay noi dung div.con cua 1 trang chuong thanh chuoi cac <p>.
function collectPage(doc) {
    var con = safeFirst(doc.select("div.con"));
    if (con === null) return "";
    con.select("script, style, iframe, ins").remove();
    var paras = con.select("p");
    var out = "";
    var i = 0;
    for (i = 0; i < paras.size(); i++) {
        var t = cleanText(paras.get(i).text());
        if (t) out += "<p>" + t + "</p>";
    }
    return out;
}

// Tim link "下一页" tren trang chuong; tra ve URL tuyet doi hoac "".
function nextSplitHref(doc) {
    var links = doc.select("a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = a.attr("href");
            if (!href) return "";
            return absUrl(href);
        }
    }
    return "";
}

function execute(url) {
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    var r = fetchSgDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var title = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1 !== null) {
        var raw = cleanText(h1.text());
        var idx = raw.lastIndexOf(">");
        title = idx !== -1 ? cleanText(raw.substring(idx + 1)) : raw;
    }
    if (!title) {
        var t = doc.select("title");
        if (t.size() > 0) {
            var full = cleanText(t.get(0).text());
            var dash = full.indexOf("-");
            title = dash !== -1 ? cleanText(full.substring(0, dash)) : full;
        }
    }

    var html = collectPage(doc);
    if (!html) {
        return Response.error("Không tìm thấy nội dung chương (site có thể đã đổi giao diện): " + chapUrl);
    }

    // Ghep cac trang chia (link 下一页 -> -2.html, -3.html...).
    var next = nextSplitHref(doc);
    var pages = 1;
    while (next && pages < 10) {
        var rr = fetchSgDoc(next);
        if (rr.error) break;
        var part = collectPage(rr.doc);
        if (!part) break;
        html += part;
        pages++;
        next = nextSplitHref(rr.doc);
    }

    return Response.success(html, title);
}
