// chap.js — noi dung mot chuong (execute(url) -> html).
// Layout da kiem chung cua khotruyenchu.fun:
//   h1                  "Chuong N: Ten"
//   .entry-content      noi dung; thuong la nhieu <p>, co chuong chi co
//                       MOT <p> lon noi bang <br> (vd. ch.150) nen phai
//                       tach theo <br> chu khong chi lay tung <p>.
// KHUYET LON DA KIEM CHUNG: mot dai chuong cua mot so truyen (vd. Tran
// Van Truong Sinh, trang muc luc 10-22) web goc de TRONG — .entry-content
// chi chua ~257 <div class="markdown ..."> rong, 0 ky tu. Khong co
// endpoint nao khac de lay noi dung (chapter.js chi chong copy). Truong
// hop nay chap.js tra loi tieng Viet ro rang thay vi tra rong.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('cleanHtml.js');
load('safe-first.js');

function isJunk(line) {
    if (!line) return true;
    if (line.indexOf("Bạn đang đọc truyện trên") !== -1) return true;
    if (line.indexOf("khotruyenchu.fun") !== -1 && line.length < 80) return true;
    if (line === "Báo lỗi chương" || line === "Quảng cáo") return true;
    return false;
}

function toLines(html) {
    var out = [];
    var s = String(html || "");
    s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
    s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
    s = s.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " ");
    s = s.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n");
    s = s.replace(/<[^>]+>/g, " ");
    var parts = s.split("\n");
    for (var i = 0; i < parts.length; i++) {
        var t = cleanText(parts[i]);
        if (!isJunk(t)) out.push(t);
    }
    return out;
}

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("khotruyenchu.fun", 500, 1500);
    var res = fetchWithFallback(url, MIRROR_LIST);
    var doc = res ? docFromResponse(res, url) : null;
    if (!doc) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);

    var title = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1) title = cleanText(h1.text());

    var lines = [];
    var entry = safeFirst(doc.select(".entry-content"));
    if (entry) {
        var ps = entry.select("p");
        for (var i = 0; i < ps.size(); i++) {
            var t = cleanText(ps.get(i).text());
            if (!isJunk(t)) lines.push(t);
        }
        if (lines.length < 3) {
            var more = toLines(entry.html());
            if (more.length > lines.length) lines = more;
        }
    }
    if (lines.length === 0) {
        return Response.error("Chương này chưa có nội dung trên web gốc (web để trống). Hãy thử chương khác hoặc quay lại sau.");
    }
    if (title && lines.length > 0 && lines[0] === title) lines.shift();

    return Response.success(cleanHtml(lines.join("<br>")), title);
}
