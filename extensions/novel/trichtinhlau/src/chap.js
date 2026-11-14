// chap.js — Noi dung chuong: /doc-truyen/<slug>/chuong-N.
// Duong chinh: <div id="chapterContentEncoded" data-encoded="base64(HTML)">
// (giai ma khong khoa — xem config.js). Ten chuong lay tu <title>
// (dang "<ten truyen> - <ten chuong>", bo phan ten truyen).
// Luu y (kiem chung VM 2026-11-14):
// - Trang chuong can Referer la trang chi tiet (suy ra tu URL chuong).
// - 403 chan bot theo UA: thu WebView mot lan (WebView dung UA trinh
//   duyet that; cung IP, UA Chrome tra 200 trong khi UA mac dinh bi 403).
//   429/405 thi KHONG dung WebView (ghi cooldown, quy tac 11 AGENTS.md).
// - Chuong khoa (can Kim Cuong / dang nhap): tra loi tieng Viet ro rang,
//   khong mo khoa.
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("URL chương không hợp lệ");
    // Referer phai la trang chi tiet: /doc-truyen/<slug>/chuong-N -> /xem-truyen/<slug>
    var detailUrl = BASE_URL + "/";
    var m = chapUrl.match(/^(https?:\/\/[^\/]+)\/doc-truyen\/([^\/]+)\/chuong-/);
    if (m) detailUrl = m[1] + "/xem-truyen/" + m[2];

    var r = null;
    try {
        r = pacedFetch(chapUrl, { referer: detailUrl, headers: { "User-Agent": SITE_UA } });
    } catch (e) {
        return Response.error("Không tải được chương (lỗi mạng): " + chapUrl);
    }
    if (!r) return Response.error("Không tải được chương: " + chapUrl);
    if (r.error === "cooldown") {
        return Response.error(rateLimitErrorMessage("Trích Tinh Lâu", pacedHostOf(chapUrl), r.cooldownRemainingMs));
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return Response.error(rateLimitErrorMessage("Trích Tinh Lâu", pacedHostOf(chapUrl), r.cooldownRemainingMs));
        }
        if (st === 403) return fetchViaBrowserFallback(chapUrl, "");
        if (st) return Response.error("Không tải được chương (HTTP " + st + "): " + chapUrl);
        return Response.error("Không tải được chương (lỗi mạng): " + chapUrl);
    }

    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return Response.error("Không đọc được nội dung chương.");
    }
    if (!doc) return Response.error("Không đọc được nội dung chương.");

    var title = chapterTitle(doc);

    // Duong chinh: giai ma data-encoded.
    var encEl = selFirst(doc, "#chapterContentEncoded");
    if (encEl) {
        var encoded = encEl.attr("data-encoded") || "";
        if (encoded) {
            var decoded = b64decodeUtf8(encoded);
            if (decoded && decoded.trim().length > 0) {
                return Response.success(fixNoCopyWords(decoded), title);
            }
        }
    }

    // Khong co noi dung ma hoa: kiem tra dau hieu khoa / dang nhap.
    var bodyText = "";
    try {
        bodyText = doc.body() ? doc.body().text() : "";
    } catch (e3) {}
    if (bodyText.indexOf("không đủ Kim Cương") !== -1 ||
        bodyText.indexOf("Vui lòng đăng nhập") !== -1 ||
        bodyText.indexOf("cần đăng nhập") !== -1) {
        return Response.error("Chương này cần Kim Cương hoặc cần đăng nhập để đọc — extension không mở khóa nội dung trả phí.");
    }
    return fetchViaBrowserFallback(chapUrl, title);
}

// Ten chuong tu <title> ("<ten truyen> - <ten chuong>").
function chapterTitle(doc) {
    var title = "";
    try {
        var t = doc.select("title").text();
        if (t) {
            var idx = t.indexOf(" - ");
            title = idx !== -1 ? t.substring(idx + 3).trim() : t.trim();
        }
    } catch (e) {}
    return title;
}

// <span data-text="tu"></span> -> tu (site chen tu kieu nay de chong copy).
function fixNoCopyWords(html) {
    return String(html || "").replace(/<span[^>]*data-text="([^"]*)"[^>]*>\s*<\/span>/g, "$1");
}

// Du phong: mo trang bang WebView headless roi lay noi dung da giai ma
// (#chapterContentDecoded) hoac .entry-content.chapter-c.
function fetchViaBrowserFallback(chapUrl, title) {
    var doc = null;
    try {
        doc = fetchBrowser(chapUrl, 20000);
    } catch (e) {
        return Response.error("Không tải được nội dung chương");
    }
    if (!doc) return Response.error("Không tải được nội dung chương");
    var contentEl = selFirst(doc, "#chapterContentDecoded");
    if (contentEl) {
        var h0 = contentEl.html() || "";
        if (h0.trim().length > 0) {
            contentEl.select("script, style, noscript, iframe, ins, button, a, .print-block-message").remove();
            var h = contentEl.html();
            h = fixNoCopyWords(h);
            if (h && h.trim().length > 0) return Response.success(h, title);
        }
    }
    var el = selFirst(doc, ".entry-content.chapter-c");
    if (!el) el = selFirst(doc, ".chapter-c");
    if (!el) el = selFirst(doc, ".entry-content");
    if (!el) return Response.error("Không tìm thấy nội dung chương (có thể chương này yêu cầu Kim Cương hoặc cần đăng nhập).");
    el.select("script, style, noscript, iframe, ins, button, a, .print-block-message, #chapterContentEncoded").remove();
    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");
    return Response.success(fixNoCopyWords(html), title);
}
