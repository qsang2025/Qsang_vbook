// challenge-handler.js — Xu ly Cloudflare challenge va yeu cau dang nhap kieu Legado trong vBook
//
// GIOI HAN KY THUAT CUA vBOOK EXTENSION:
// - Runtime vBook khong co API popup hay hop thoai trinh duyet tuong tac truc tiep cho nguoi dung.
// - Cong cu trinh duyet duy nhat trong engine la Headless WebView thong qua Engine.newBrowser()
//   (chay ngam trong nen de render JavaScript / lay cookie).
// - GIAI PHAP TOI UU (Legado-style trong gioi han vBook):
//   1. Phat hien Cloudflare challenge (Turnstile, "Just a moment...", cf-mitigated...) hoac yeu cau dang nhap.
//   2. Thu tu dong vuot qua bang Headless WebView (Engine.newBrowser): Headless WebView chia se
//      kho cookie / phien voi In-App Browser cua app vBook. Neu nguoi dung tung giai captcha hoac
//      dang nhap thanh cong tren trinh duyet app, headless WebView co the su dung lai cookie do.
//   3. Neu van bi chan, tra ve Response.error(...) tieng Viet kem huong dan tung buoc ro rang
//      de nguoi dung mo bieu tuong Trinh duyet trong app vBook, xac minh hoac dang nhap roi quay lai.
//
// QUY TAC BUILD & RUNTIME (Rhino ES6):
// - File nay la thu vien dung chung dat tai lib/ o root repo. Khi build, file se duoc inline vao src/.
// - TUYET DOI KHONG goi load(...) ben trong file nay (load khong de quy).
// - Chi dung var, function, noi chuoi bang dau +. Cấm const, let, arrow function, template string,
//   optional chaining (?.) hay nullish coalescing (??).

function formatChallengeError(siteName, url) {
    var name = siteName || "Website";
    var targetUrl = url || "";
    return "Website " + name + " đang kích hoạt xác minh Cloudflare (chống bot).\n\n" +
        "Hướng dẫn vượt qua:\n" +
        "1. Mở icon Trình duyệt (quả địa cầu / Mở trang gốc) tích hợp trong app vBook.\n" +
        "2. Truy cập: " + targetUrl + "\n" +
        "3. Chờ hoặc tích chọn xác minh 'Tôi là con người' trên màn hình cho đến khi vào được trang web.\n" +
        "4. Sau khi hoàn tất, quay lại đây và tải lại truyện.";
}

function formatLoginError(siteName, url) {
    var name = siteName || "Website";
    var targetUrl = url || "";
    return "Website " + name + " yêu cầu đăng nhập để xem nội dung chương này.\n\n" +
        "Hướng dẫn đăng nhập:\n" +
        "1. Mở icon Trình duyệt tích hợp trong app vBook.\n" +
        "2. Truy cập: " + targetUrl + "\n" +
        "3. Tiến hành đăng nhập tài khoản của bạn trên website.\n" +
        "4. Sau khi đăng nhập thành công, quay lại đây và tải lại truyện.";
}

function isCloudflareChallenge(html, headers) {
    if (headers) {
        var cfMitigated = headers["cf-mitigated"] || headers["Cf-Mitigated"] || headers["CF-Mitigated"];
        if (cfMitigated && String(cfMitigated).toLowerCase() === "challenge") {
            return true;
        }
        var cfChlBypass = headers["cf-chl-bypass"] || headers["Cf-Chl-Bypass"];
        if (cfChlBypass) {
            return true;
        }
    }
    if (!html) return false;
    var s = String(html);

    if (s.indexOf("challenges.cloudflare.com") !== -1) return true;
    if (s.indexOf("cf-turnstile") !== -1) return true;
    if (s.indexOf("cf-challenge-running") !== -1) return true;
    if (s.indexOf("cf_chl_opt") !== -1 || s.indexOf("cf-browser-verification") !== -1) return true;
    if (/just a moment/i.test(s) && s.indexOf("cloudflare") !== -1) return true;
    if (s.indexOf("Chờ một chút") !== -1 && s.indexOf("cloudflare") !== -1) return true;
    if (s.indexOf("<title>Just a moment...</title>") !== -1) return true;
    if (s.indexOf("<title>Please Wait... | Cloudflare</title>") !== -1) return true;

    return false;
}

function isLoginRequired(html, url) {
    if (url) {
        var u = String(url).toLowerCase();
        if (u.indexOf("/login") !== -1 || u.indexOf("/dang-nhap") !== -1 ||
            u.indexOf("/signin") !== -1 || u.indexOf("/auth") !== -1) {
            return true;
        }
    }
    if (!html) return false;
    var s = String(html);

    if (s.indexOf("Vui lòng đăng nhập") !== -1) return true;
    if (s.indexOf("Chương VIP yêu cầu đăng nhập") !== -1) return true;
    if (s.indexOf("Bạn cần đăng nhập") !== -1) return true;
    if (s.indexOf("Đăng nhập để đọc") !== -1) return true;
    if (s.indexOf("Đăng nhập để tiếp tục") !== -1) return true;
    if (s.indexOf("Đăng nhập tài khoản") !== -1) return true;
    if (s.indexOf("login-required") !== -1) return true;
    if (s.indexOf("class=\"login-box\"") !== -1 || s.indexOf("id=\"login-form\"") !== -1) return true;
    if (s.indexOf("请先登录") !== -1) return true;
    if (s.indexOf("登录后阅读") !== -1) return true;
    if (s.indexOf("Sign in to continue") !== -1) return true;
    if (s.indexOf("Please sign in") !== -1) return true;
    if (s.indexOf("Please log in") !== -1) return true;

    return false;
}

function isChallengeDoc(doc) {
    if (!doc) return true;
    var title = "";
    try {
        title = String(doc.select("title").text());
    } catch (e) {
        title = "";
    }
    if (/just a moment/i.test(title)) return true;
    if (title.indexOf("Chờ một chút") !== -1) return true;
    try {
        var body = String(doc.html());
        if (isCloudflareChallenge(body, null)) return true;
    } catch (e2) {
    }
    return false;
}

function fetchViaBrowser(url, timeoutMs) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") {
        return null;
    }
    var browser = null;
    var timeout = timeoutMs || 15000;
    try {
        browser = Engine.newBrowser();
        var doc = browser.launch(url, timeout);
        var tries = 0;
        while (doc && tries < 4 && isChallengeDoc(doc)) {
            doc = browser.html(3000);
            tries = tries + 1;
        }
        if (!doc || isChallengeDoc(doc)) {
            if (browser && browser.close) browser.close();
            return null;
        }
        if (browser && browser.close) browser.close();
        return doc;
    } catch (e) {
        try {
            if (browser && browser.close) browser.close();
        } catch (e2) {
        }
        console.log("fetchViaBrowser error: " + e);
        return null;
    }
}

function fetchWithChallengeHandler(url, options) {
    options = options || {};
    var siteName = options.siteName || "Website";
    var timeout = options.timeout || 15000;
    var headers = options.headers || {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
    };

    var fetchRes = null;
    var rawText = "";
    var httpStatus = 0;
    var respHeaders = {};

    try {
        fetchRes = fetch(url, {
            headers: headers,
            method: options.method || "GET",
            body: options.body
        });
        if (fetchRes) {
            httpStatus = fetchRes.status;
            respHeaders = fetchRes.headers || {};
            rawText = String(fetchRes.text() || "");
        }
    } catch (eFetch) {
        console.log("fetchWithChallengeHandler fetch error: " + eFetch);
    }

    var cfBlocked = (httpStatus === 403 || httpStatus === 503) || isCloudflareChallenge(rawText, respHeaders);
    var loginBlocked = isLoginRequired(rawText, url);

    if (!cfBlocked && !loginBlocked && fetchRes && fetchRes.ok && rawText) {
        return {
            ok: true,
            status: httpStatus,
            text: rawText,
            html: rawText,
            doc: null,
            response: fetchRes
        };
    }

    // Neu bi Cloudflare hoac yeu cau dang nhap hoac fetch that bai: thu Headless WebView
    var browserDoc = fetchViaBrowser(url, timeout);
    if (browserDoc) {
        var bHtml = "";
        try {
            bHtml = String(browserDoc.html() || "");
        } catch (eHtml) {
        }
        if (bHtml && !isCloudflareChallenge(bHtml, null) && !isLoginRequired(bHtml, url)) {
            return {
                ok: true,
                status: 200,
                text: bHtml,
                html: bHtml,
                doc: browserDoc,
                browser: true
            };
        }
        if (isLoginRequired(bHtml, url)) {
            loginBlocked = true;
        }
        if (isCloudflareChallenge(bHtml, null)) {
            cfBlocked = true;
        }
    }

    if (cfBlocked) {
        return {
            ok: false,
            status: httpStatus || 403,
            isChallenge: true,
            error: formatChallengeError(siteName, url)
        };
    }

    if (loginBlocked) {
        return {
            ok: false,
            status: httpStatus || 401,
            isLogin: true,
            error: formatLoginError(siteName, url)
        };
    }

    return {
        ok: false,
        status: httpStatus || 0,
        error: "Không thể kết nối đến " + siteName + " (HTTP " + httpStatus + "): " + url
    };
}
