// chap.js — Giai ma 2 tang AES noi dung chuong tren La Ca Truyen (kem ho tro TOKEN va fallback previewHtml)
load('crypto.js');
load('config.js');

function decryptChapterContent(pageProps) {
    if (!pageProps) return { html: "", title: "" };
    var chapterEnc = pageProps.chapter || {};
    var rsEnc = pageProps.rs || {};
    var riEnc = pageProps.ri || "";
    var commentCount = pageProps.comment_count;

    // Tang 1: Giai ma ri va rs bang MASTER_KEY -> tinh firstKey = "" + (rs[ri] + comment_count)
    // QUIRK (da xac minh bang openssl, 2026-11-08): rs chi co khoa "0"-"99" nen khi ri giai ra
    // "585" thi rs[ri] = undefined; comment_count thuong la [] (mang rong) nen
    // "" + (undefined + []) = "undefined" — DUNG la firstKey that. KHONG "sua" thanh kiem tra
    // rsVal !== undefined hay ep kieu comment_count, se pha khoa that.
    // Chi truong hop firstKey = "NaN" (comment_count la so/undefined) la khoa hong — luc do bo
    // qua cac buoc AES, chi thu noi dung tho (plaintext) neu co.
    var riDec = aesDecrypt(riEnc, MASTER_KEY);
    var rsDec = aesDecryptObject(rsEnc, MASTER_KEY);
    var rsVal = (rsDec && riDec !== "") ? rsDec[riDec] : undefined;
    var firstKey = "" + (rsVal + commentCount);
    var firstKeyOk = !!(firstKey && firstKey !== "NaN");

    // Giai ma cac truong cua chapter bang firstKey (chi khi firstKey hop le)
    var chapterDec = {};
    var secondKey = "";
    if (firstKeyOk) {
        chapterDec = aesDecryptObject(chapterEnc, firstKey);
        secondKey = aesDecrypt(chapterDec.key_encrypt, firstKey);
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

    var title = String((chapterDec && chapterDec.title) || pageProps.chapterTitle || pageProps.title || "").trim();
    return { html: String(html || "").trim(), title: title };
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

// Fallback DOM khi trang khong co NEXT_DATA (tu main 21f2fff): thu doc truc tiep the
// .chapter-content / article trong HTML, khong can giai ma AES.
function extractDomChapterFallback(res, rawHtml) {
    if (res && typeof res.html === "function") {
        try {
            var doc = res.html();
            if (doc && typeof doc.select === "function") {
                var el = doc.select(".chapter-content, #chapter-content, article").first();
                if (el) {
                    var domHtml = cleanChapterHtml(el.html() || "");
                    if (domHtml && domHtml.length > 50) return domHtml;
                }
            }
        } catch (e) {
        }
    }
    if (rawHtml) {
        var m = String(rawHtml).match(/<article[^>]*>([\s\S]*?)<\/article>/i);
        if (m && m[1]) {
            var artHtml = cleanChapterHtml(m[1]);
            if (artHtml && artHtml.length > 50) return artHtml;
        }
    }
    return "";
}

function tryBrowserExtract(chapterUrl) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(chapterUrl, 7000);
        var doc = browser.html(2000);
        // Thu lay cookie token tu phien trinh duyet de luu lai cho cac lan doc sau khoi can mo
        // browser (saveToken luc nay moi thuc su duoc goi — truoc day la dead code). Neu site dat
        // cookie HttpOnly hoac khong co token thi bo qua, khong anh huong viec doc chuong.
        try {
            var cookieText = browser.callJs("document.cookie", 3000);
            if (cookieText) {
                var cookieStr = String(cookieText.text ? cookieText.text() : cookieText);
                var tm = cookieStr.match(/(?:^|;\s*)token=([^;]+)/i);
                if (tm && tm[1]) saveToken(tm[1]);
            }
        } catch (eCookie) {
        }
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

    var res = null;
    try {
        res = fetch(chapterUrl, {
            method: "GET",
            headers: buildAuthHeaders({
                "Referer": BASE_URL + "/"
            })
        });
    } catch (e) {
        return Response.error("Không thể tải trang chương truyện (lỗi mạng).");
    }
    if (!res || !res.ok) {
        return Response.error("Không thể tải trang chương truyện.");
    }

    var rawHtml = "";
    try {
        rawHtml = String(res.text() || "");
    } catch (e) {
    }

    var nextData = rawHtml ? extractNextData(rawHtml) : null;
    if (!nextData) {
        try {
            nextData = extractNextData(res.html());
        } catch (e2) {
        }
    }

    var pageProps = (nextData && nextData.props && nextData.props.pageProps) ? nextData.props.pageProps : null;
    if (!pageProps) {
        var domOnly = extractDomChapterFallback(res, rawHtml);
        if (domOnly) {
            return Response.success(domOnly);
        }
        var browserProps = tryBrowserExtract(chapterUrl);
        if (browserProps) {
            var browserDecoded = decryptChapterContent(browserProps);
            var browserHtml = cleanChapterHtml(browserDecoded.html);
            if (browserHtml) {
                return Response.success(browserHtml, browserDecoded.title);
            }
            pageProps = browserProps;
        }
        if (!pageProps) {
            return Response.error("Không đọc được dữ liệu chương từ trang.");
        }
    }

    if (pageProps.chapterExists === false) {
        return Response.error("Chương truyện không tồn tại.");
    }

    var decoded = decryptChapterContent(pageProps);
    var html = cleanChapterHtml(decoded.html);
    if (html) {
        return Response.success(html, decoded.title);
    }

    var notify = String(pageProps.notify || "").trim().toLowerCase();

    // Thu lay tu phien trinh duyet vBook khi chua co TOKEN hoac TOKEN het han (notify
    // not_login) — truoc day chi thu khi chua co TOKEN, nen TOKEN het han la ket luon.
    if (!getSavedToken() || notify === "not_login") {
        var browserProps2 = tryBrowserExtract(chapterUrl);
        if (browserProps2) {
            var browserDecoded2 = decryptChapterContent(browserProps2);
            var browserHtml2 = cleanChapterHtml(browserDecoded2.html);
            if (browserHtml2) {
                return Response.success(browserHtml2, browserDecoded2.title);
            }
            if (!pageProps.previewHtml && browserProps2.previewHtml) {
                pageProps = browserProps2;
                decoded = decryptChapterContent(pageProps);
            }
        }
    }

    // Xet notify TRUOC khi tra preview (truoc day preview tra truoc nen loi "banned" khong bao
    // gio toi duoc): tai khoan bi khoa / chuong yeu cau mua goi thi bao loi luon, khong tra preview.
    // Rieng not_login thi VAN tra preview + huong dan dang nhap — day la tinh nang "doc truoc"
    // da quang cao trong README (previewHtml chua ca tieu de chuong, test.json chap phu thuoc
    // vao do tren dev server khi chua dang nhap), chu khong phai loi nghiem trong.
    notify = String(pageProps.notify || "").trim().toLowerCase();
    if (notify === "banned") {
        return Response.error("Tài khoản của bạn đang bị tạm khóa trên La Cà Truyện.");
    }
    if (notify === "no_package" || notify === "need_package" || notify === "must_buy") {
        return Response.error("Chương này yêu cầu mua gói đọc hoặc mở khóa trên La Cà Truyện.");
    }

    // Fallback sang previewHtml neu server tra san noi dung xem truoc; neu khong co preview
    // thi thu doc DOM truc tiep trong HTML.
    var preview = cleanChapterHtml(pageProps.previewHtml || "");
    if (!preview) {
        preview = extractDomChapterFallback(res, rawHtml);
    }
    if (preview) {
        var note = "<br><p><i>[Nội dung xem trước — Để đọc trọn vẹn toàn bộ chương trên La Cà Truyện, vui lòng đăng nhập tài khoản trong trình duyệt vBook hoặc cấu hình TOKEN trong cài đặt tiện ích.]</i></p>";
        return Response.success(preview + note, decoded.title);
    }

    if (notify === "not_login") {
        if (getSavedToken()) {
            return Response.error("Token đăng nhập hết hạn hoặc không hợp lệ. Vui lòng cập nhật lại TOKEN trong cài đặt.");
        }
        return Response.error("Chương yêu cầu đăng nhập. Vui lòng đăng nhập trên trình duyệt vBook hoặc điền TOKEN trong cài đặt extension.");
    }

    return Response.error("Không thể giải mã nội dung chương truyện.");
}
