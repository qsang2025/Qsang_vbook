// chap.js — Noi dung chuong: /truyen/x-<short8>/chuong/<short8>.
// Trang chuong SSR day du: noi dung nam trong div.chapter-content
// (chi co 1 the nay tren trang — the skeleton dung class
// "skl-chapter-content" nen khong trung selector). Chuong chu: cac
// doan <p class="MsoNormal">; chuong minh hoa: cac anh <img
// class="chapter-illustration"> trong <p> can giua. Kiem chung tu VM
// 2026-11-14: Danmachi ch. mo dau 135 doan, mo dau "Nhung tieng gam
// ru hoa vao nhau..."; chuong "Hinh minh hoa" 21 anh; ch.301 Trong
// Sinh (balance 167) 198 doan day du. Khong can dang nhap, khong
// Cloudflare, khong xoay UA. Ten chuong lay tu <title> (phan truoc
// " - "). Neu khong tim thay noi dung thi kiem tra dau hieu khoa /
// dang nhap trong HTML tho truoc khi bao loi — chuong khoa (neu co)
// bao loi tieng Viet ro rang, khong mo khoa.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var chapId = extractChapId(url);
    var novelId = extractNovelId(url);
    if (!chapId || !novelId) return Response.error("URL chương không hợp lệ");

    var webUrl = BASE_URL + "/truyen/x-" + shortId(novelId) + "/chuong/" + shortId(chapId);
    var r = null;
    try {
        r = pacedFetch(webUrl);
    } catch (e) {
        return Response.error("Không tải được chương (lỗi mạng): " + webUrl);
    }
    if (!r) return Response.error("Không tải được chương: " + webUrl);
    if (r.error === "cooldown") {
        return Response.error(rateLimitErrorMessage("Valvrareteam", pacedHostOf(webUrl), r.cooldownRemainingMs));
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return Response.error(rateLimitErrorMessage("Valvrareteam", pacedHostOf(webUrl), r.cooldownRemainingMs));
        }
        if (st) return Response.error("Không tải được chương (HTTP " + st + "): " + webUrl);
        return Response.error("Không tải được chương (lỗi mạng): " + webUrl);
    }
    var rawHtml = "";
    try {
        rawHtml = r.res.text();
    } catch (e2) {
        return Response.error("Không đọc được nội dung chương: " + webUrl);
    }
    if (!rawHtml) return Response.error("Không đọc được nội dung chương (site trả về rỗng).");

    var doc = null;
    try {
        doc = Html.parse(rawHtml);
    } catch (e3) {
        return Response.error("Không đọc được nội dung chương.");
    }
    if (!doc) return Response.error("Không đọc được nội dung chương.");

    var contentEl = null;
    var els = doc.select(".chapter-content");
    if (els && els.size() > 0) contentEl = els.get(0);
    if (contentEl) {
        contentEl.select("script, style, noscript, iframe").remove();
        var html = contentEl.html();
        if (html && html.trim().length > 0) {
            html = html.replace(/<p[^>]*>\s*(<br[^>]*>)?\s*<\/p>/gi, "");
            if (stripHtml(html).length > 0 || html.indexOf("<img") !== -1) {
                var title = "";
                var tm = rawHtml.match(/<title>([^<]*)<\/title>/i);
                if (tm) {
                    title = cleanText(tm[1]);
                    var dash = title.indexOf(" - ");
                    if (dash !== -1) title = title.substring(0, dash).trim();
                }
                return Response.success(html, title);
            }
        }
    }

    var low = rawHtml.toLowerCase();
    if (low.indexOf("đăng nhập") !== -1 && low.indexOf("để đọc") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập để đọc — extension không tự đăng nhập.");
    }
    if (low.indexOf("mở khóa") !== -1 || low.indexOf("cần xu") !== -1) {
        return Response.error("Chương này đang bị khóa — cần mở khóa trên valvrareteam.net, extension không mở khóa chương trả phí.");
    }
    return Response.error("Không đọc được nội dung chương (site có thể đã đổi giao diện).");
}
