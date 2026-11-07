// chap.js — Giai ma 2 tang AES noi dung chuong tren La Ca Truyen (kem ho tro TOKEN va fallback previewHtml)
load('crypto.js');
load('config.js');

function decryptChapterContent(pageProps) {
    if (!pageProps) return "";
    var chapterEnc = pageProps.chapter || {};
    var rsEnc = pageProps.rs || {};
    var riEnc = pageProps.ri || "";
    var commentCount = pageProps.comment_count;

    // Tang 1: Giai ma ri va rs bang MASTER_KEY -> tinh firstKey = "" + (rs[ri] + comment_count)
    var riDec = aesDecrypt(riEnc, MASTER_KEY);
    var rsDec = aesDecryptObject(rsEnc, MASTER_KEY);
    var rsVal = (rsDec && riDec !== "") ? rsDec[riDec] : undefined;
    var firstKey = "" + (rsVal + commentCount);

    // Giai ma cac truong cua chapter bang firstKey
    var chapterDec = aesDecryptObject(chapterEnc, firstKey);
    var secondKey = aesDecrypt(chapterDec.key_encrypt, firstKey);
    if (!secondKey && chapterEnc.key_encrypt) {
        secondKey = aesDecrypt(chapterEnc.key_encrypt, firstKey);
    }

    var cipher = chapterDec.content || pageProps.contentEncrypt || chapterEnc.content || "";
    var html = "";

    if (cipher && secondKey) {
        html = aesDecrypt(cipher, secondKey);
    }
    if (!html && pageProps.contentEncrypt && secondKey && cipher !== pageProps.contentEncrypt) {
        html = aesDecrypt(pageProps.contentEncrypt, secondKey);
    }
    if (!html && chapterDec.content_comp && secondKey) {
        html = aesDecrypt(chapterDec.content_comp, secondKey);
    }
    if (!html && chapterDec.content && String(chapterDec.content).indexOf("<") !== -1) {
        html = String(chapterDec.content);
    }
    if (!html && chapterEnc.content && String(chapterEnc.content).indexOf("<") !== -1) {
        html = String(chapterEnc.content);
    }

    return String(html || "").trim();
}

function cleanChapterHtml(html) {
    if (!html) return "";
    return String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<h[1-6][^>]*>\s*\[DBG-[\s\S]*?<\/h[1-6]>\s*/gi, "")
        .replace(/<p[^>]*>\s*\[DBG-[\s\S]*?<\/p>\s*/gi, "")
        .trim();
}

function tryBrowserExtract(chapterUrl) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(chapterUrl, 7000);
        var doc = browser.html();
        if (doc) {
            var nextData = extractNextData(doc);
            if (nextData && nextData.props && nextData.props.pageProps) {
                return nextData.props.pageProps;
            }
        }
    } catch (e) {
    } finally {
        try {
            if (browser) browser.close();
        } catch (e2) {
        }
    }
    return null;
}

function execute(url) {
    var chapterUrl = stripQueryAndHash(normalizeUrl(url)).replace(/\/+$/, "");
    if (!chapterUrl) return Response.error("URL chương không hợp lệ.");

    var res = fetch(chapterUrl, {
        method: "GET",
        headers: buildAuthHeaders()
    });
    if (!res || !res.ok) {
        return Response.error("Không thể tải trang chương truyện.");
    }

    var nextData = extractNextData(res.html());
    var pageProps = (nextData && nextData.props && nextData.props.pageProps) ? nextData.props.pageProps : null;
    if (!pageProps) {
        return Response.error("Không đọc được dữ liệu chương từ trang.");
    }

    if (pageProps.chapterExists === false) {
        return Response.error("Chương truyện không tồn tại.");
    }

    var html = cleanChapterHtml(decryptChapterContent(pageProps));
    if (html) {
        return Response.success(html);
    }

    // Neu chua co noi dung ma hoa (vd: notify === "not_login") va nguoi dung chua dien TOKEN,
    // thu lay tu phien trinh duyet vBook (neu nguoi dung da dang nhap trong trinh duyet)
    if (!getSavedToken()) {
        var browserProps = tryBrowserExtract(chapterUrl);
        if (browserProps) {
            var browserHtml = cleanChapterHtml(decryptChapterContent(browserProps));
            if (browserHtml) {
                return Response.success(browserHtml);
            }
            if (!pageProps.previewHtml && browserProps.previewHtml) {
                pageProps = browserProps;
            }
        }
    }

    var notify = String(pageProps.notify || "").trim().toLowerCase();

    // Fallback sang previewHtml neu server tra san noi dung xem truoc
    var preview = cleanChapterHtml(pageProps.previewHtml || "");
    if (preview) {
        var note = "<br><p><i>[Nội dung xem trước — Để đọc trọn vẹn toàn bộ chương trên La Cà Truyện, vui lòng đăng nhập tài khoản trong trình duyệt vBook hoặc cấu hình TOKEN trong cài đặt tiện ích.]</i></p>";
        if (notify === "no_package" || notify === "need_package" || notify === "must_buy") {
            note = "<br><p><i>[Nội dung xem trước — Chương này yêu cầu gói đọc hoặc mở khóa trên web La Cà Truyện.]</i></p>";
        }
        return Response.success(preview + note);
    }

    if (notify === "banned") {
        return Response.error("Tài khoản của bạn đang bị tạm khóa trên La Cà Truyện.");
    }
    if (notify === "no_package" || notify === "need_package" || notify === "must_buy") {
        return Response.error("Chương này yêu cầu mua gói đọc hoặc mở khóa trên La Cà Truyện.");
    }
    if (notify === "not_login") {
        if (getSavedToken()) {
            return Response.error("Token đăng nhập hết hạn hoặc không hợp lệ. Vui lòng cập nhật lại TOKEN trong cài đặt.");
        }
        return Response.error("Chương yêu cầu đăng nhập. Vui lòng đăng nhập trên trình duyệt vBook hoặc điền TOKEN trong cài đặt extension.");
    }

    return Response.error("Không thể giải mã nội dung chương truyện.");
}
