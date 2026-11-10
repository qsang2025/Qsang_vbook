// chap.js — Doc noi dung chuong SangtacvietApp
// TOI UU TOC DO DOC:
// 1. Smart Key Caching: chapterkey + readcontextid cua STV dung chung cho moi chuong cua cung truyen.
//    Khi doc chuong tiep theo, dung ngay key da cache ma KHONG can xin grant hoac khoi dong WebView (0s tre).
// 2. Tu dong invalidate cache va lay lai key moi neu server bao het han/sai khoa.
// 3. Bo loc lam sach van ban theo chuan cua Mobile App Sáng Tác Việt.

load('crypto.js');
load('config.js');
load('rate-limit.js');
load('challenge-handler.js');

function stvMd5(string) {
    return CryptoJS.MD5(string).toString();
}

function parseChapterUrl(url) {
    var host = "";
    var bookid = "";
    var cid = "";

    var mQuery = url.match(/[?&]bookid=([^&]+)/);
    var mC = url.match(/[?&]c=([^&]+)/);
    var mH = url.match(/[?&]h=([^&]+)/);
    if (mQuery && mC && mH) {
        bookid = mQuery[1];
        cid = mC[1];
        host = mH[1];
    } else {
        var mPath = url.match(/\/truyen\/([^\/]+)\/\d+\/([^\/]+)\/([^\/?#]+)/);
        if (mPath) {
            host = mPath[1];
            bookid = mPath[2];
            cid = mPath[3];
        }
    }
    return { host: host, bookid: bookid, cid: cid };
}

function extractReadContextId(res) {
    if (!res) return "";
    var cookieStr = "";
    if (res.headers) {
        if (typeof res.headers.get === "function") {
            cookieStr = res.headers.get("Set-Cookie") || res.headers.get("set-cookie") || "";
        }
        if (!cookieStr) {
            for (var k in res.headers) {
                if (k.toLowerCase() === "set-cookie") {
                    var val = res.headers[k];
                    if (val) {
                        cookieStr += (typeof val === "string" ? val : (val.join ? val.join("; ") : String(val))) + "; ";
                    }
                }
            }
        }
    }
    var m = cookieStr.match(/readcontextid=([^;,\s]+)/i);
    return m ? m[1] : "";
}

function evaluateChapterKey(base, code) {
    var chapterkey = "";

    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") {
        return "";
    }

    for (var attempt = 0; attempt < 2 && !chapterkey; attempt++) {
        var browser = null;
        try {
            browser = Engine.newBrowser();
            if (typeof browser.setUserAgent === "function") {
                browser.setUserAgent(STV_WEBVIEW_UA);
            }
            var shell = "<html><head><meta charset='utf-8'></head><body><pre id='stv_key_out'></pre></body></html>";
            browser.loadHtml(base, shell);

            var runner = "(function(){"
                + "var fw = {Capacitor:{},document:{hidden:false},navigator:{userAgent:'" + STV_WEBVIEW_UA + "'}," + STV_GRANT_FLAG_WINDOW + ":true,app:{" + STV_GRANT_FLAG_APP + ":true,reader:{}}};"
                + "window.fakeWindow = fw;"
                + "window.Capacitor = {};"
                + "window." + STV_GRANT_FLAG_WINDOW + " = true;"
                + "window.document = window.document || {};"
                + "window.document.hidden = false;"
                + "window.app = {" + STV_GRANT_FLAG_APP + ":true, reader:{}};"
                // Chi doc chapterkey tu window.app.reader — KHONG dung gia tri tra ve
                // cua eval() lam key: ma grant tra undefined (chung minh bang chay
                // that trong Node, nghien cuu APK 10/11), dung no chi them rui ro.
                + "try{ (0,eval)(" + JSON.stringify(code) + "); }catch(e){}"
                + "var k = String((window.app && window.app.reader && (window.app.reader.chapterkey || window.app.reader.chapterKey || window.app.reader.key)) || '');"
                + "if (!k) { k = String((fw.app && fw.app.reader && (fw.app.reader.chapterkey || fw.app.reader.chapterKey || fw.app.reader.key)) || ''); }"
                + "try{document.getElementById('stv_key_out').innerText = k;}catch(_){}"
                + "return k;"
                + "})()";

            var resDoc = browser.callJs(runner, 15000);
            if (resDoc) {
                chapterkey = resDoc.text();
            }
            if (!chapterkey) {
                var el = browser.html().select("#stv_key_out").first();
                if (el) chapterkey = el.text();
            }
        } catch (eBrowser) {
            chapterkey = "";
        } finally {
            try {
                if (browser && typeof browser.close === "function") browser.close();
            } catch (eClose) {}
        }
    }

    return (chapterkey || "").trim();
}

function waitBounded(ms) {
    try {
        sleep(ms);
    } catch (e) {
    }
}

function cleanChapterContent(raw, host) {
    if (!raw) return "";
    var text = String(raw);

    // Bo ky tu dac biet UTF BOM va Unicode rac
    text = text.replace(/^\uFEFF/, "");
    text = text.replace(/\ufffe/g, "");

    // Bo thong bao luu tru he thong
    text = text.replace(/<p>\s*<span[^>]*>@Bạn đang đọc bản lưu[^<]*<\/span>\s*<\/p>/gi, "");
    text = text.replace(/<span[^>]*>@Bạn đang đọc bản lưu[^<]*<\/span>/gi, "");

    // Xu ly the dich <i>
    text = text.replace(/<\/i>\s*<i\b/gi, "</i> <i");
    text = text.replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "$1");

    // Lam sach chuyen biet theo tung host (chuan app.reader.preprocess cua STV Mobile)
    if (host === "uukanshu") {
        text = text.replace(/<div class="ad_content">[\s\S]*?<\/div>/gi, "");
    } else if (host === "ciweimao") {
        text = text.replace(/<span>[\s\S]*?<\/span>/gi, "");
    } else if (host === "fanqie") {
        text = text.replace(/<\/?article>/gi, "");
        text = text.replace(/_i_/g, "~");
        text = text.replace(/src="http:\/\//gi, 'src="https://');
    } else if (host === "faloo") {
        text = text.replace(/<br>/g, "<br>\n");
        text = text.replace(/<br>\n([^“][^\n“]*?)”<br>/g, "<br>“$1”<br>");
        text = text.replace(/<br>\n/g, "<br>");
    }

    // Xoa lien ket quang cao chen ngang
    text = text.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "");

    // Thay the cau thoai kieu Mobile App
    text = text.replace(/đạo ?<\/i>:/gi, "nói</i>:");
    text = text.replace(/&nbsp;&nbsp;&nbsp;&nbsp;/gi, "<br>");

    // Chuan hoa dau cau va khoang cach giong app mobile
    text = text.replace(/(\w) \./g, "$1.");
    text = text.replace(/([\w>])“/g, "$1 “");
    text = text.replace(/ ”/g, "”");
    text = text.replace(/ ([,\.!\?”]+)/g, "$1");

    // Dinh dang dong va doan van
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    text = text.replace(/\n\t/g, "</p><p>");
    text = text.replace(/\n/g, "<br>");
    text = "<p>" + text + "</p>";
    text = text.replace(/<p>\s*<\/p>/g, "");
    text = text.replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");

    return text;
}

function requestGrantAndKey(host, bookid) {
    var grantUrl = BASE_URL + "/io/grantcontext/context?hostid=" + encodeURIComponent(host) + "&bookid=" + encodeURIComponent(bookid);
    var grantRes = null;
    try {
        grantRes = fetchWithMirrors(grantUrl, {
            method: "GET",
            headers: {
                "x-stv-transport": "app",
                "x-requested-with": "com.sangtacviet.mobilereader",
                "Cookie": "mac_tt=true;"
            }
        });
    } catch (eGrant) {
        return { error: "Không kết nối được tới Sáng Tác Việt khi xin quyền đọc: " + eGrant };
    }

    if (!grantRes || !grantRes.ok) {
        var blockedGrant = stvBlockedMessage();
        if (blockedGrant) return { error: blockedGrant };
        var rawGrant = grantRes ? String(grantRes.text() || "") : "";
        if (isCloudflareChallenge(rawGrant, grantRes ? grantRes.headers : null)) {
            return { error: formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + host + "/1/" + bookid + "/") };
        }
        var gwGrant = stvGatewayErrorMessage(grantRes ? grantRes.status : 0);
        if (gwGrant) return { error: gwGrant };
        return { error: "Không thể xin quyền đọc từ máy chủ Sáng Tác Việt (HTTP " + (grantRes ? grantRes.status : 0) + ")" };
    }

    var code = grantRes.text();
    if (isCloudflareChallenge(code, grantRes.headers)) {
        return { error: formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + host + "/1/" + bookid + "/") };
    }
    var readcontextid = extractReadContextId(grantRes);
    var chapterkey = evaluateChapterKey(BASE_URL, code);

    if (!chapterkey) {
        return { error: "Không thể giải mã khóa đọc chương (chapterkey) từ Sáng Tác Việt." };
    }
    return { key: chapterkey, readcontextid: readcontextid };
}

function readChapterOnce(host, bookid, cid, chapterkey, readcontextid) {
    var sorted = "bookid=" + bookid + "&c=" + cid + "&h=" + host + "&key=" + chapterkey + "&sajax=readchapter&";
    var sign = stvMd5(sorted + STV_SIGN_SALT);

    var cookie = "mac_tt=true;";
    if (readcontextid) {
        cookie += " readcontextid=" + readcontextid + ";";
    }

    var readUrl = BASE_URL + "/?sajax=readchapter&h=" + encodeURIComponent(host)
        + "&bookid=" + encodeURIComponent(bookid)
        + "&c=" + encodeURIComponent(cid)
        + "&key=" + encodeURIComponent(chapterkey);

    var readRes = null;
    try {
        readRes = fetchWithMirrors(readUrl, {
            method: "GET",
            headers: {
                "x-stv-transport": "app",
                "x-requested-with": "com.sangtacviet.mobilereader",
                "x-stv-sign": sign,
                "Cookie": cookie,
                "Referer": BASE_URL + "/truyen/" + encodeURIComponent(host) + "/1/" + encodeURIComponent(bookid) + "/"
            }
        });
    } catch (eRead) {
        return { error: "Không kết nối được tới Sáng Tác Việt khi đọc chương: " + eRead };
    }

    if (!readRes || !readRes.ok) {
        var blockedRead = stvBlockedMessage();
        if (blockedRead) return { error: blockedRead };
        var rawReadErr = readRes ? String(readRes.text() || "") : "";
        if (isCloudflareChallenge(rawReadErr, readRes ? readRes.headers : null)) {
            return { error: formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + host + "/1/" + bookid + "/") };
        }
        var gwRead = stvGatewayErrorMessage(readRes ? readRes.status : 0);
        if (gwRead) return { error: gwRead };
        return { error: "Không đọc được nội dung chương STV (HTTP " + (readRes ? readRes.status : 0) + ")" };
    }

    var rawRead = String(readRes.text() || "");
    if (isCloudflareChallenge(rawRead, readRes.headers)) {
        return { error: formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + host + "/1/" + bookid + "/") };
    }
    if (isLoginRequired(rawRead, readUrl)) {
        return { error: formatLoginError("Sáng Tác Việt", BASE_URL) };
    }

    var json = null;
    try {
        json = JSON.parse(rawRead);
    } catch (eJson) {
        return { error: "Máy chủ Sáng Tác Việt không trả dữ liệu chương hợp lệ: " + rawRead.substring(0, 120) };
    }

    return { json: json };
}

function execute(url) {
    var parsed = parseChapterUrl(url);
    var host = parsed.host;
    var bookid = parsed.bookid;
    var cid = parsed.cid;

    if (!host || !bookid || !cid) {
        // Direct-read fallback (port tu ban Web Sang Tac Viet v10, P3
        // 2026-11-10): neu la URL web truc tiep khong parse duoc tham so
        // bookid/c/h thi doc thang trang chuong va boc noi dung tu
        // #content-container (loai script/iframe/quang cao) thay vi bao
        // loi URL khong hop le ngay.
        if (url.indexOf("http") !== 0) {
            if (url.charAt(0) !== '/') url = '/' + url;
            url = BASE_URL + url;
        }
        var directRes = null;
        try {
            directRes = fetchWithMirrors(url);
        } catch (eDirect) {
            return Response.error("Không tải được trang chương Sáng Tác Việt: " + eDirect);
        }
        var blockedDirect = stvBlockedMessage();
        if (blockedDirect) return Response.error(blockedDirect);
        if (directRes && directRes.ok) {
            var rawDirect = String(directRes.text() || "");
            if (isCloudflareChallenge(rawDirect, directRes.headers)) {
                return Response.error(formatChallengeError("Sáng Tác Việt", url));
            }
            if (isLoginRequired(rawDirect, url)) {
                return Response.error(formatLoginError("Sáng Tác Việt", url));
            }
            var doc = directRes.html();
            var el = doc.select("#content-container, .content, .reading-content").first();
            if (el) {
                el.select("script, iframe, .ads").remove();
                return Response.success(cleanChapterContent(el.html(), host));
            }
        }
        var gwDirect = stvGatewayErrorMessage(directRes ? directRes.status : 0);
        if (gwDirect) return Response.error(gwDirect);
        return Response.error("URL chương Sáng Tác Việt không hợp lệ: " + url);
    }

    var chapterkey = "";
    var readcontextid = "";

    // 1. Kiem tra cache: Neu truyen nay da tung doc truoc do, lay key tu cache
    var cached = getStoredKey(host, bookid);
    if (cached && cached.key) {
        chapterkey = cached.key;
        readcontextid = cached.readcontextid || "";

        // Thu doc ngay voi key da cache (TOC DO TUC THI, KHONG CAN WEBVIEW)
        // STV tra code 0 (= thanh cong, chung minh tu code site stv.ui.js)
        // hoac 1 khi doc duoc; chi code khac moi coi la key hong.
        var fastAttempt = readChapterOnce(host, bookid, cid, chapterkey, readcontextid);
        if (fastAttempt.json && (String(fastAttempt.json.code) === "0" || String(fastAttempt.json.code) === "1") && fastAttempt.json.data) {
            return Response.success(cleanChapterContent(fastAttempt.json.data, host));
        }

        // Neu doc bang cached key that bai (code 7, 10002 hoac key het han), xoa cache va lay lai key moi
        clearStoredKey(host, bookid);
        chapterkey = "";
        readcontextid = "";
    }

    // 2. Neu chua co key hoac key cu het han: Xin grant va giai ma chapterkey
    var grant = requestGrantAndKey(host, bookid);
    if (grant.error) {
        return Response.error(grant.error);
    }
    chapterkey = grant.key;
    readcontextid = grant.readcontextid;

    // 3. Doc chuong voi key moi
    var attempt1 = readChapterOnce(host, bookid, cid, chapterkey, readcontextid);
    if (attempt1.error) return Response.error(attempt1.error);

    var json = attempt1.json;

    // Xu ly loi code 7 (may chu dang dich / dang tai chuong): cho 1,2s roi
    // thu lai TOI DA 1 LAN — va lan retry PHAI xin lai grant + key moi
    // truoc khi doc (key cu co the het han theo phien dich), khong doc lai
    // bang key cu nhu ban cu (port tu ban Web Sang Tac Viet v10, P3 2026-11-10).
    if (json && (String(json.code) === "7" || json.code === 7)) {
        waitBounded(1200);
        var grant2 = requestGrantAndKey(host, bookid);
        if (grant2.error) {
            return Response.error(grant2.error);
        }
        var attempt2 = readChapterOnce(host, bookid, cid, grant2.key, grant2.readcontextid);
        if (attempt2.error) return Response.error(attempt2.error);
        json = attempt2.json;
    }

    if (!json) {
        return Response.error("Không nhận được phản hồi từ Sáng Tác Việt.");
    }

    // STV tra code 0 khi thanh cong (code site stv.ui.js: x.code == "0" thi
    // hien thi x.data) — giu code 1 phong thu neu server co luc tra 1.
    // Chi code khac 0/1 moi la loi that su (vd. 7 da retry o tren, 10002 key
    // het han/moi truong khong khop).
    if (String(json.code) !== "0" && String(json.code) !== "1") {
        clearStoredKey(host, bookid);
        var msg = json.err || json.info || ("Mã phản hồi STV không hợp lệ: " + json.code);
        return Response.error("Lỗi từ Sáng Tác Việt: " + msg);
    }

    if (!json.data) {
        return Response.error("Chương không có nội dung.");
    }

    // Chi cache key SAU KHI doc chuong thanh cong lan dau (I6): key hong
    // thi khong bao gio duoc cache, chuong sau se xin grant moi thay vi
    // doc bang key hong trong cache.
    setStoredKey(host, bookid, chapterkey, readcontextid);

    return Response.success(cleanChapterContent(json.data, host));
}
