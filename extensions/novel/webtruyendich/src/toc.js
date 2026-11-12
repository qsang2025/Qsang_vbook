// toc.js — muc luc day du qua API cua site.
// Luong chinh (kiem chung live 2026-11-12, mau Cẩu Tại Võ Đạo Thế Giới
// Thành Thánh, novel_id 3811): lay novel_id + defaultSource tu trang chi
// tiet, goi GET /api/novels/{id}/chapters?source={source}&limit=10000 —
// tra 1.814 muc (1.808 URL duy nhat, co 6 URL trung — dedupe theo URL),
// tong 1 trang, khong phan trang nen KHONG co page.js.
// Du phong: quet link a[href*='/chuong-'] trong trang chi tiet (chi lay
// duoc vai chuong moi nhat).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load("config.js");
load("rate-limit.js");

function execute(url) {
    url = normalizeUrl(url);
    var res = fetchPage(url);
    if (!res || !res.ok) {
        if (res && (res.status === 429 || res.status === 405)) {
            return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(url), cooldownRemainingMs(pacedHostOf(url))));
        }
        if (res && res.status === 403) {
            return Response.error("Trang truyện bị Cloudflare chặn (HTTP 403). Mở truyện trong trình duyệt của app một lần để qua xác minh rồi thử lại.");
        }
        if (res && res.status) return Response.error("Không tải được mục lục (HTTP " + res.status + ").");
        return Response.error("Không tải được mục lục (lỗi mạng).");
    }
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được trang truyện.");
    var html = doc.html() + "";

    var nIdMatch = html.match(/novel_id\s*=\s*["'](\d+)["']/);
    var sNameMatch = html.match(/defaultSource\s*=\s*["']([^"']+)["']/);
    var nSlugMatch = html.match(/novel_url\s*=\s*["']([^"']+)["']/);
    var slug = nSlugMatch ? nSlugMatch[1] : "";
    if (!slug) {
        var slugMatch = url.match(/\/truyen\/([^\/\?#]+)/i);
        if (slugMatch) slug = slugMatch[1];
    }
    var novelId = nIdMatch ? nIdMatch[1] : "";
    var sourceName = sNameMatch ? sNameMatch[1] : "sudugu";

    var allChapters = [];
    var seen = {};

    if (novelId) {
        var apiUrl = BASE_URL + "/api/novels/" + novelId + "/chapters?source=" + encodeURIComponent(sourceName) + "&limit=10000";
        var r = pacedFetch(apiUrl, {
            headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" }
        });
        if (r.ok) {
            var json = null;
            try {
                json = r.res.json();
            } catch (e) {
                json = null;
            }
            var data = (json && json.data) ? json.data : ((json && json.items) ? json.items : []);
            if (data && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var chSlug = data[i].chapter_url || data[i].slug || "";
                    if (!chSlug) continue;
                    var cUrl = BASE_URL + "/truyen/" + slug + "/" + sourceName + "/" + chSlug;
                    if (!seen[cUrl]) {
                        allChapters.push({
                            name: cleanText(data[i].title || data[i].name || ("Chương " + (i + 1))),
                            url: cUrl,
                            host: BASE_URL
                        });
                        seen[cUrl] = true;
                    }
                }
                return Response.success(allChapters);
            }
        }
    }

    // Du phong: quet DOM neu khong goi duoc API.
    doc.select("a[href*='/chuong-']").forEach(function (el) {
        var href = el.attr("href") + "";
        var name = cleanText(el.text() + "");
        if (href && name && href.indexOf("danh-sach-chuong") < 0) {
            var fullUrl = normalizeUrl(href);
            if (!seen[fullUrl]) {
                allChapters.push({ name: name, url: fullUrl, host: BASE_URL });
                seen[fullUrl] = true;
            }
        }
    });
    if (allChapters.length === 0) {
        return Response.error("Không lấy được mục lục.");
    }
    return Response.success(allChapters);
}
