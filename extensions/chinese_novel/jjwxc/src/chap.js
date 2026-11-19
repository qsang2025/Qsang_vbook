// chap.js — Noi dung 1 chuong (execute(url) -> html, tieu de chuong).
//
// Trang chuong onebook.php?novelid=<id>&chapterid=<n> (kiem chung
// live 2026-11-19 tu VM + probe dien thoai cua muse-main, task 094):
// - Chuong mien phi: noi dung trong div.noveltext (HTML tinh, khong
//   can JS). Tieu de chuong o h2 dang "第 N 章" (CO khoang trang;
//   dang "第N章" khong khoang trang chi o chan trang — cat theo
//   dang co khoang trang truoc). Noi dung khong co the p: text tho
//   tach bang br, thut dau dong bang &nbsp;.
// - Rac UI phai cat: dau noveltext co [添加书签] / [推荐给朋友] /
//   [投诉] / danh sach khieu nai / 文章收藏...; cuoi co 插入书签 /
//   作者有话说 / 显示所有文的作话 / 请稍候... Ghi chu tac gia nam
//   trong script#note_str o ngoai noveltext (bo script la het).
// - Chuong VIP: site chuyen sang trang dang nhap my.jjwxc.net
//   (title chua "登入", khong co div.noveltext) — bao loi ro rang,
//   TUYET DOI khong bypass VIP/dang nhap/mua chuong.
// - doc.title() khong co tren runtime dien thoai (probe 19/11 gap
//   TypeError) nen lay title bang the title qua select.
//
// Tai len: file config.js, file config-helpers.js, file
// fetch-helpers.js, file rate-limit.js, file safe-first.js, file
// gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

// Dong rac UI trong div.noveltext (dau + cuoi chuong).
// Trang gop nhieu muc UI tren CUNG 1 dong (vd "[添加书签] [推荐给朋友]
// [投诉]", "作者有话说 显示所有文的作话") nen khong the so khop
// chinh xac ca dong: dong rac neu chua bat ky cum UI dac trung nao,
// hoac khop chinh xac 1 token ngan, hoac la dong dieu huong chan
// trang dang "第1章 第 1 章".
var JUNK_SUBSTRINGS = [
    "[添加书签]", "[推荐给朋友]", "[投诉]", "作者有话说",
    "显示所有文的作话", "插入书签", "为收藏文章分类",
    "新增收藏类别", "查看收藏列表", "定制收藏类别"
];
var JUNK_LINES = [
    "投诉色情有害", "投诉涉未成年有害",
    "投诉数据造假", "投诉伪更", "其他", "文章收藏",
    "请稍候", "推荐给朋友", "添加书签", "投诉", "新增", "取消"
];

function isJunkLine(t) {
    var i = 0;
    for (i = 0; i < JUNK_LINES.length; i++) {
        if (t === JUNK_LINES[i]) return true;
    }
    for (i = 0; i < JUNK_SUBSTRINGS.length; i++) {
        if (t.indexOf(JUNK_SUBSTRINGS[i]) !== -1) return true;
    }
    // Dong dieu huong chan trang: "第1章 第 1 章" (tieu de don
    // da bi loai o tren bang t === title).
    if (/^第\s*\d+\s*章(\s+第\s*\d+\s*章)?$/.test(t)) return true;
    return false;
}

function execute(url) {
    var chapUrl = String(url || "");
    if (chapUrl.charAt(0) === "/") chapUrl = siteOrigin() + chapUrl;
    chapUrl = normalizeUrl(chapUrl);
    var r = fetchJjDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Chuong VIP bi chuyen sang trang dang nhap: title chua "登入".
    var pageTitle = "";
    var titleEl = safeFirst(doc.select("title"));
    if (titleEl !== null) pageTitle = String(titleEl.text() || "");
    if (pageTitle.indexOf("登入") !== -1 || pageTitle.indexOf("登录") !== -1) {
        return Response.error("Chương VIP trên jjwxc.net (cần đăng nhập/mua chương) — extension chỉ đọc chương miễn phí, không bypass VIP.");
    }

    var contentEl = safeFirst(doc.select("div.noveltext"));
    if (contentEl === null) {
        return Response.error("Không đọc được nội dung chương (có thể là chương VIP hoặc site đã đổi giao diện): " + chapUrl);
    }
    contentEl.select("script, style").remove();

    // Tieu de chuong: h2 "第 N 章"; fallback <title> "...^第N章^...".
    var title = "";
    var h2 = safeFirst(doc.select("h2"));
    if (h2 !== null) title = cleanText(h2.text());
    if (!title && pageTitle) {
        var tm = /(第\s*\d+\s*章)/.exec(pageTitle);
        if (tm) title = cleanText(tm[1]);
    }
    if (!title) title = "Chương";

    // Tach noi dung theo br thanh tung dong text.
    var rawHtml = String(contentEl.html() || "");
    rawHtml = rawHtml.replace(/<br\s*\/?>/gi, "\n");
    var rawText = stripTags(rawHtml);
    rawText = rawText.replace(/&nbsp;/gi, " ").replace(/&#160;/g, " ");
    var lines = rawText.split("\n");

    // Cat rac dau trang: bo moi dong truoc dong tieu de "第 N 章"
    // (dang co khoang trang) neu tim thay trong 30 dong dau.
    var start = 0;
    var i = 0;
    var scan = Math.min(30, lines.length);
    for (i = 0; i < scan; i++) {
        if (/^第\s+\d+\s+章/.test(cleanText(lines[i]))) {
            start = i + 1;
            break;
        }
    }

    var parts = [];
    for (i = start; i < lines.length; i++) {
        var t = cleanText(lines[i]);
        if (!t || isJunkLine(t)) continue;
        if (t === title) continue;
        parts.push("<p>" + t + "</p>");
    }
    var html = parts.join("");
    if (!html || cleanText(stripTags(html)).length < 20) {
        return Response.error("Chương này chưa có nội dung (có thể là chương VIP bị khoá hoặc trống): " + chapUrl);
    }

    return Response.success(html, title);
}
