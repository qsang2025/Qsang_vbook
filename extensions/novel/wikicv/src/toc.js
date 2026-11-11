// toc.js — Mục lục chương qua API /book/index (có sign)
// Contract: execute(url) → [{ name*, url*, host? }]
// API: GET /book/index?bookId=..&start=..&size=..&signKey=..&sign=sha256(fuzzySign(signKey+start+size))
// fuzzySign(x) = x.substring(10) + x.substring(0, 10)  (offset 10, lấy từ trang detail)
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    // Bước 1: đọc trang detail để lấy bookId + signKey + offset fuzzySign
    rateLimitDelay("wikicv.org");
    var res = wikiFetch(url);
    if (!res.ok) return Response.error("Không tải được trang truyện (HTTP " + res.status + ")");
    var html = res.text() + "";

    var bookId = "";
    var signKey = "";
    var fuzzyOffset = 10; // mặc định, sẽ đọc từ trang nếu có
    var m1 = html.match(/var bookId = "([^"]+)"/);
    if (m1) bookId = m1[1] + "";
    var m2 = html.match(/var signKey = "([^"]+)"/);
    if (m2) signKey = m2[1] + "";
    var m3 = html.match(/function fuzzySign\(text\) \{\s*return text\.substring\((\d+)\)/);
    if (m3) fuzzyOffset = parseInt(m3[1], 10) || 10;

    if (!bookId || !signKey) return Response.error("Không lấy được mã truyện (bookId/signKey) từ trang chi tiết");

    function fuzzySign(text) {
        return text.substring(fuzzyOffset) + text.substring(0, fuzzyOffset);
    }

    var chapters = [];
    var seen = {};
    var start = 0;
    var SIZE = 501; // giới hạn server: size > 501 → 404

    // Gọi lặp cho tới khi hết chương hoặc an toàn (max 20 vòng ~ 10000 chương)
    for (var round = 0; round < 20; round++) {
        var sign = wikiSha256(fuzzySign(signKey + start + SIZE));
        var apiUrl = BASE_URL + "/book/index?bookId=" + encodeURIComponent(bookId)
            + "&start=" + start + "&size=" + SIZE
            + "&signKey=" + encodeURIComponent(signKey)
            + "&sign=" + sign;

        rateLimitDelay("wikicv.org");
        var apiRes = wikiFetch(apiUrl, url);
        if (!apiRes.ok) return Response.error("Không tải được mục lục (HTTP " + apiRes.status + ") — có thể cần đăng nhập wikicv.org, xem hướng dẫn trong README của nguồn.");

        var doc = apiRes.html();
        var got = 0;
        doc.select(".chapter-name a.truncate").forEach(function (el) {
            var name = (el.text().trim()) + "";
            var chapUrl = (el.attr("href") || "") + "";
            if (!name || !chapUrl) return;
            if (chapUrl.indexOf("chuong-") === -1) return; // bỏ entry rỗng (&nbsp;)
            if (seen[chapUrl]) return;
            seen[chapUrl] = true;
            if (!chapUrl.startsWith("http")) chapUrl = BASE_URL + chapUrl;
            chapters.push({ name: name, url: chapUrl, host: BASE_URL });
            got++;
        });

        if (got < SIZE) break; // đã hết chương
        start += SIZE;
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");
    return Response.success(chapters);
}