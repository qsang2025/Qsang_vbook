// toc.js — Mục lục chương qua API /book/index (có sign)
// Contract: execute(url) → [{ name*, url*, host? }]
// API: GET /book/index?bookId=..&start=..&size=..&signKey=..&sign=sha256(fuzzySign(signKey+start+size))
// fuzzySign(x) = x.substring(offset) + x.substring(0, offset) (offset lấy từ trang detail)
// LUU Y: signKey rang buoc theo IP client, KHONG phai theo dang nhap —
// tai detail va goi API phai cung IP (may that IP on dinh nen chay duoc;
// VM curl egress xoay nen khong test duoc toc). Gap 404 thi tai lai
// detail lay sign moi va thu lai 1 lan (IP co the vua doi giua 2 request).
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = wikiNormalizeUrl(url);

    var SIZE = 501; // giới hạn server: size > 501 → 404

    // Doc trang detail de lay bookId + signKey + offset fuzzySign.
    // Regex khong phu thuoc ten bien/kieu khai bao (var/let/const) de
    // site minify/doi ten bien van bat duoc.
    function loadDetail() {
        rateLimitDelay("wikicv.org");
        var res = wikiFetch(url);
        if (!res.ok) return { error: "Không tải được trang truyện (HTTP " + res.status + ")" };
        var html = res.text() + "";

        var bookId = "";
        var signKey = "";
        var fuzzyOffset = 10; // mặc định, sẽ đọc từ trang nếu có
        var m1 = html.match(/\b(?:var|let|const)?\s*bookId\s*=\s*"([^"]+)"/);
        if (m1) bookId = m1[1] + "";
        var m2 = html.match(/\b(?:var|let|const)?\s*signKey\s*=\s*"([^"]+)"/);
        if (m2) signKey = m2[1] + "";
        var m3 = html.match(/function\s+fuzzySign\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{\s*return\s+\1\.substring\((\d+)\)/);
        if (m3) fuzzyOffset = parseInt(m3[2], 10) || 10;

        if (!bookId || !signKey) return { error: "Không lấy được mã truyện (bookId/signKey) từ trang chi tiết" };
        return { bookId: bookId, signKey: signKey, fuzzyOffset: fuzzyOffset };
    }

    function fuzzySign(text, offset) {
        return text.substring(offset) + text.substring(0, offset);
    }

    // Goi 1 vong API muc luc. Tra {ok, chapters, got} hoac {error, status, pf}.
    function callApi(detail, start) {
        var sign = wikiSha256(fuzzySign(detail.signKey + start + SIZE, detail.fuzzyOffset));
        var apiUrl = BASE_URL + "/book/index?bookId=" + encodeURIComponent(detail.bookId)
            + "&start=" + start + "&size=" + SIZE
            + "&signKey=" + encodeURIComponent(detail.signKey)
            + "&sign=" + sign;
        // Lay API qua pacedFetch: nghi jitter truoc request, retry
        // 429/405/503 toi da 3 lan, ghi cooldown khi bi chan.
        // Cookie dang nhap (neu co) gui kem qua headers.
        var pf = pacedFetch(apiUrl, { headers: wikiHeaders(url) });
        if (!pf.ok) return { error: true, status: pf.status, pf: pf };
        var doc = pf.res.html();
        var chapters = [];
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
        return { ok: true, chapters: chapters, got: got };
    }

    var detail = loadDetail();
    if (detail.error) return Response.error(detail.error);

    var chapters = [];
    var seen = {};
    var start = 0;

    // Gọi lặp cho tới khi hết chương hoặc an toàn (max 20 vòng ~ 10000 chương)
    for (var round = 0; round < 20; round++) {
        var r = callApi(detail, start);
        if (r.error && r.status === 404) {
            // 404: sign het han do IP doi giua 2 request — tai lai detail
            // lay bo sign moi roi thu lai 1 lan cho vong nay.
            var detail2 = loadDetail();
            if (detail2.error) return Response.error(detail2.error);
            detail = detail2;
            r = callApi(detail, start);
        }
        if (r.error) {
            if (r.pf && (r.pf.error === "cooldown" || r.status === 405 || r.status === 429)) {
                return Response.error(rateLimitErrorMessage("Wiki Dịch", "wikicv.org", r.pf.cooldownRemainingMs));
            }
            if (r.status === 404) return Response.error("Không tải được mục lục (HTTP 404) — máy có thể vừa đổi mạng/IP giữa chừng (mã mục lục của site ràng buộc theo IP); thử tải lại mục lục sau ít phút.");
            if (r.status === 401 || r.status === 403) return Response.error("Mục lục cần đăng nhập wikicv.org — đăng nhập bằng trình duyệt trong app rồi nhập cookie vào cài đặt wikicvCookie của nguồn.");
            return Response.error("Không tải được mục lục (HTTP " + r.status + ")");
        }

        for (var i = 0; i < r.chapters.length; i++) chapters.push(r.chapters[i]);
        if (r.got < SIZE) break; // đã hết chương
        start += SIZE;
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương nào");
    return Response.success(chapters);
}
