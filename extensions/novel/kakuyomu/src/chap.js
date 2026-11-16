// chap.js — Noi dung 1 chuong tu HTML tinh (execute(url) -> html, tieu
// de chuong). URL vao la /works/<id>/episodes/<epId>. Trang chuong KHONG
// co __NEXT_DATA__ — than bai nam trong .widget-episodeBody (selector
// cua base khoa301020 v1, van dung — kiem chung live 2026-11-16), tieu de
// trong .widget-episodeTitle. Loai bo khoang trang thua, giu nguyen doan
// van goc (p id="pN").
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeKakuyomuUrl(url);
    if (!chapUrl) return Response.error("Không có đường dẫn chương.");
    if (parseWorkId(chapUrl) === "" || parseEpisodeId(chapUrl) === "") {
        return Response.error("Không đọc được đường dẫn chương.");
    }
    var r = pacedFetch(chapUrl, {
        method: "GET",
        headers: { "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        timeout: 20000,
        maxRetries: 2
    });
    if (!r.ok) {
        if (r.error === "cooldown" || r.status === 429 || r.status === 405) {
            return Response.error(rateLimitErrorMessage("カクヨム", "kakuyomu.jp", r.cooldownRemainingMs));
        }
        if (r.status) return Response.error("Không tải được chương (HTTP " + r.status + ").");
        return Response.error("Không kết nối được tới カクヨム, hãy kiểm tra mạng rồi thử lại.");
    }
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e) {
        doc = null;
    }
    if (!doc) return Response.error("Không đọc được nội dung chương.");

    var title = "";
    var titleEl = safeFirst(doc.select(".widget-episodeTitle"));
    if (titleEl !== null) title = cleanText(titleEl.text());
    if (!title) {
        var h1 = safeFirst(doc.select("h1"));
        if (h1 !== null) title = cleanText(h1.text());
    }

    var bodyEl = safeFirst(doc.select(".widget-episodeBody"));
    if (bodyEl === null) return Response.error("Không đọc được nội dung chương.");
    var bodyHtml = "";
    try {
        bodyHtml = String(bodyEl.html() || "");
    } catch (e) {
        bodyHtml = "";
    }
    if (!bodyHtml) return Response.error("Không đọc được nội dung chương.");
    var cleaned = cleanHtml(bodyHtml);
    var plain = stripTags(cleaned).replace(/\s+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương.");
    return Response.success(cleaned, title);
}
