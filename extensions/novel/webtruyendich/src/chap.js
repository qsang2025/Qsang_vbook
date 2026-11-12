// chap.js — noi dung chuong qua API /api/getChapter cua site.
// Luong (theo ban goc kychi v2, giu nguyen):
//  1. Fetch HTML trang chuong (fetch cua app dung chung cookie trinh duyet
//     nen co the qua duoc Cloudflare neu nguoi dung da xac minh trong app
//     truoc do) de lay chapter_id / novel_id / source_name / source_id /
//     chapter_url / novel_url.
//  2. POST /api/getChapter voi translator "Vietphrase" — ban dich tra ve
//     la ban Vietphrase (convert), chua kiem chung truc tiep tu VM do
//     Cloudflare chan IP datacenter (kiem chung 2026-11-12); se xac nhan
//     kieu van ban tu ket qua test tren may that (xem README).
//  3. Du phong: doc thang #article / #chapter-content-body tu HTML trang.
// Neu trang chuong tra 403 (Cloudflare challenge): bao loi ro rang de
// nguoi dung mo truyen trong trinh duyet cua app mot lan roi doc lai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load("config.js");
load("rate-limit.js");

function isValidContent(text) {
    if (!text || ("" + text).replace(/\s/g, "").length < 50) return false;
    var lower = ("" + text).toLowerCase();
    if (lower.indexOf("mô hình ai hiện đang quá tải") >= 0) return false;
    if (lower.indexOf("vui lòng thử lại sau") >= 0) return false;
    if (lower.indexOf("cloudflare") >= 0) return false;
    if (lower.indexOf("just a moment") >= 0) return false;
    if (lower.indexOf("chờ một chút") >= 0) return false;
    var trimmed = ("" + text).replace(/^\s+|\s+$/g, "");
    if (trimmed.charAt(0) === "{" && trimmed.indexOf('"detail"') >= 0) return false;
    return true;
}

function cleanContent(text) {
    var s = "" + text;
    s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    s = s.replace(/<ins[^>]*>[\s\S]*?<\/ins>/gi, "");
    s = s.replace(/<\/?(p|div|article|section|h[1-6]|blockquote|li|tr|ul|ol)[^>]*>/gi, "\n");
    s = s.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<[^>]+>/g, "");
    s = s.replace(/&nbsp;/gi, " ");
    s = s.replace(/&quot;/gi, '"');
    s = s.replace(/&#39;/gi, "'");
    s = s.replace(/&lt;/gi, "<");
    s = s.replace(/&gt;/gi, ">");
    s = s.replace(/&amp;/gi, "&");
    s = s.replace(/[ \t]+/g, " ");
    s = s.replace(/ *\n */g, "\n");
    s = s.replace(/\n{3,}/g, "\n\n");
    s = s.replace(/^\s+|\s+$/g, "");
    return s.replace(/\n/g, "<br>");
}

function execute(url) {
    url = normalizeUrl(url);
    try {
        // Buoc 1: lay HTML trang chuong de trich tham so.
        var res = fetchPage(url);
        if (!res || !res.ok) {
            if (res && (res.status === 429 || res.status === 405)) {
                return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(url), cooldownRemainingMs(pacedHostOf(url))));
            }
            if (res && res.status === 403) {
                return Response.error("Trang chương bị Cloudflare chặn (HTTP 403). Mở truyện trong trình duyệt của app một lần để qua xác minh rồi đọc lại chương này.");
            }
            if (res && res.status) return Response.error("Không tải được trang chương (HTTP " + res.status + ").");
            return Response.error("Không tải được trang chương (lỗi mạng).");
        }
        var doc = res.html();
        if (!doc) return Response.error("Không đọc được trang chương.");
        var html = doc.html() + "";
        var titleEl = safeFirst(doc.select("h1"));
        var chTitle = titleEl ? cleanText(titleEl.text() + "") : "";

        // Buoc 2: trich cac tham so can thiet tu HTML.
        var getVar = function (regex, def) {
            var match = html.match(regex);
            return (match && match[1]) ? match[1] : (def || "");
        };
        var chapterId = getVar(/chapter_id\s*[=:]\s*["']?(\d+)["']?/);
        var novelId = getVar(/novel_id\s*[=:]\s*["']?(\d+)["']?/);
        var sourceName = getVar(/source_name\s*[=:]\s*["']([^"']+)["']/, "sudugu");
        var sourceId = getVar(/sourceId\s*[=:]\s*["']?(\d+)["']?/);
        var chapterUrl = getVar(/chapterUrl\s*[=:]\s*["']([^"']+)["']/);
        var novelUrl = getVar(/novel_url\s*[=:]\s*["']([^"']+)["']/);

        if (chapterId && novelId) {
            // Buoc 3: goi API getChapter voi Vietphrase.
            var payload = JSON.stringify({
                chapter_id: chapterId,
                novel_id: novelId,
                source_name: sourceName,
                source_id: sourceId,
                chapter_url: chapterUrl,
                novel_url: novelUrl,
                translator: "Vietphrase"
            });
            var r = pacedFetch(BASE_URL + "/api/getChapter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
            });
            if (r.ok && r.res) {
                var raw = "";
                try {
                    raw = r.res.text() + "";
                } catch (e) {
                    raw = "";
                }
                if (raw) {
                    try {
                        var json = JSON.parse(raw);
                        var content = json.content || json.data || "";
                        if (isValidContent(content)) return Response.success(cleanContent(content), chTitle);
                    } catch (e) {
                        if (isValidContent(raw)) return Response.success(cleanContent(raw), chTitle);
                    }
                }
            } else if (r.status === 429 || r.status === 405) {
                return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(BASE_URL + "/api/getChapter"), r.cooldownRemainingMs));
            } else if (r.status === 403) {
                return Response.error("API chương bị Cloudflare chặn (HTTP 403). Mở truyện trong trình duyệt của app một lần để qua xác minh rồi đọc lại chương này.");
            }
        }

        // Buoc 4: du phong doc thang #article tu HTML trang.
        var article = safeFirst(doc.select("#article, #chapter-content-body"));
        if (article) {
            var hc = "" + article.html();
            if (isValidContent(hc)) return Response.success(cleanContent(hc), chTitle);
        }

        return Response.error("Không lấy được nội dung chương.");
    } catch (e) {
        return Response.error("Lỗi khi đọc chương: " + (e && e.message ? e.message : "không rõ nguyên nhân"));
    }
}
