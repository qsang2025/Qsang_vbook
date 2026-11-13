// chap.js — Noi dung chuong: /<slug>/chuong-<n>-<ten>.html.
// Noi dung day du trong #chapter-content (khong can dang nhap, khong
// preview, khong 401, khong khoa — kiem chung tu VM 2026-11-13). Strip
// .signature (dong quang ba "Truyen duoc dang tai duy nhat tai TruyenTV")
// + quang cao/script/style.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTvPage(url);
    if (r.error) return Response.error(r.error);

    var doc = r.doc;
    var selectors = ["#chapter-content", ".chapter-content", "#chapter-c", ".chapter-c", ".chapter-con", "#content", ".content-chap", ".reading-content", "#reading-content", ".chapter-detail", "#chapter-detail-content", ".box-content"];
    var content = "";
    for (var i = 0; i < selectors.length; i++) {
        var el = safeFirst(doc.select(selectors[i]));
        if (el) {
            el.select(".quang-cao, script, style, .ads, .signature, .adsbygoogle, .quang-cao-holder").remove();
            var html = el.html();
            if (html && html.trim().length > 0) {
                content = html;
                break;
            }
        }
    }

    if (content) {
        return Response.success(cleanHtml(content));
    }

    return Response.error("Không tìm thấy nội dung chương — có thể chương này yêu cầu đăng nhập hoặc đã bị khóa.");
}
