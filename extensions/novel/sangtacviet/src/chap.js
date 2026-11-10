// chap.js — Doc noi dung chuong Sang Tac Viet
load('crypto.js');
load('config.js');
load('challenge-handler.js');

// stvMd5 — Ham MD5 dung de ky request doc chuong (x-stv-sign).
//
// CryptoJS co san qua file crypto.js o dau file (built-in cua runtime:
// extension-api.md "crypto.js always resolves to bundled CryptoJS", va
// file crypto.js uu tien ban bundle thay vi file crypto.js cua rieng
// minh). Ban MD5 inline RFC 1321 cu (~150 dong, kieu md5.js cua Paul
// Johnston) da duoc xoa o v6: no chi chay khi CryptoJS vang mat, ma tren
// runtime that dieu do khong xay ra — chap doc OK tren may that
// 2026-11-08, va lacatruyen trong cung repo dung dung mau nay
// (file crypto.js + src/crypto.js md5 khop lib/crypto.js).
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

// Lay chapterkey bang cach chay ma grant cua STV trong WebView that
// (Engine.newBrowser()). Co che nay da duoc kiem chung chay dung tren may
// that (2026-11-08): chi chay tren app that, khong chay duoc tu VM (key
// suy ra tu Node khac key cua WebView that, server tra ma 10002).
//
// Thu toi da 2 lan, moi lan dung mot browser moi (loi WebView nhat thoi
// thi lan 2 co the qua). browser.close() LUON nam trong finally de khong
// ro ri WebView du thanh cong, that bai hay exception.
// Ten co grant (UWNgB / tcYCI) va UA sandbox lay tu hang trong config.js.
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
                + "try{(0,eval)(" + JSON.stringify(code) + ");}catch(e){}"
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

// Cho co gioi han (toi da 1200ms, goi dung 1 lan moi lan retry code 7):
// CHI dung ham sleep() cua runtime (extension-api.md: sleep(1000)).
// Khong dung java.lang.Thread.sleep (runtime.md cam Java interop) va
// khong busy-wait (chiem CPU cua runtime). Neu sleep() khong ton tai
// thi tra ve ngay — retry code 7 van chay, chi khong cho 1,2s.
function waitBounded(ms) {
    try {
        sleep(ms);
    } catch (e) {
    }
}

function cleanChapterContent(raw) {
    if (!raw) return "";
    var text = String(raw);

    // Bo thong bao luu tru he thong
    text = text.replace(/<p>\s*<span[^>]*>@Bạn đang đọc bản lưu[^<]*<\/span>\s*<\/p>/gi, "");
    text = text.replace(/<span[^>]*>@Bạn đang đọc bản lưu[^<]*<\/span>/gi, "");

    // Xu ly cac the dich <i>: giu nguyen tu hien thi ben trong
    text = text.replace(/<\/i>\s*<i\b/gi, "</i> <i");
    text = text.replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "$1");

    // Dinh dang dong va doan van
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    text = text.replace(/\n\t/g, "</p><p>");
    text = text.replace(/\n/g, "<br>");
    text = "<p>" + text + "</p>";
    text = text.replace(/<p>\s*<\/p>/g, "");

    return text;
}

// Xin grant + giai chapterkey (1 lan). Tra ve { key, readcontextid }
// hoac { error } khi that bai.
function requestGrantAndKey(host, bookid) {
    var grantUrl = BASE_URL + "/io/grantcontext/context?hostid=" + encodeURIComponent(host) + "&bookid=" + encodeURIComponent(bookid);
    var grantRes = null;
    try {
        // KHONG set header User-Agent: de runtime dung UA mac dinh
        // (AGENTS.md muc 6 quy tac 10 — Cloudflare gan cookie theo UA).
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
        var rawGrant = grantRes ? String(grantRes.text() || "") : "";
        if (isCloudflareChallenge(rawGrant, grantRes ? grantRes.headers : null)) {
            return { error: formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + host + "/1/" + bookid + "/") };
        }
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

// Doc noi dung chuong voi mot key da co. Tra ve { json } hoac { error }.
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
        // KHONG set header User-Agent (ly do nhu o requestGrantAndKey).
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
        var rawReadErr = readRes ? String(readRes.text() || "") : "";
        if (isCloudflareChallenge(rawReadErr, readRes ? readRes.headers : null)) {
            return { error: formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + host + "/1/" + bookid + "/") };
        }
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
        return { error: "Phản hồi nội dung chương không hợp lệ." };
    }
    return { json: json };
}

function execute(url) {
    var payload = parseChapterUrl(url);
    var host = payload.host;
    var bookid = payload.bookid;
    var cid = payload.cid;

    if (!host || !bookid || !cid) {
        // Fallback: neu la URL web truc tiep khong parse duoc tham so
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
                return Response.success(cleanChapterContent(el.html()));
            }
        }
        return Response.error("URL chương Sáng Tác Việt không hợp lệ: " + url);
    }

    var grant = requestGrantAndKey(host, bookid);
    if (grant.error) {
        return Response.error(grant.error);
    }

    var read = readChapterOnce(host, bookid, cid, grant.key, grant.readcontextid);
    if (read.error) {
        return Response.error(read.error);
    }

    var json = read.json;

    // Neu may chu dang dich hoac dang tai chuong (code 7): cho co gioi
    // han 1.2 giay roi thu lai TOI DA 1 LAN — va lan retry PHAI xin lai
    // grant + key moi truoc khi doc (key cu co the het han theo phien
    // dich), khong doc lai bang key cu nhu ban cu.
    if (json && (String(json.code) === "7" || json.code === 7)) {
        waitBounded(1200);
        var grant2 = requestGrantAndKey(host, bookid);
        if (grant2.error) {
            return Response.error(grant2.error);
        }
        var read2 = readChapterOnce(host, bookid, cid, grant2.key, grant2.readcontextid);
        if (read2.error) {
            return Response.error(read2.error);
        }
        json = read2.json;
    }

    if (json) {
        if (String(json.code) === "0" || json.code === 0) {
            var content = cleanChapterContent(json.data);
            if (!content) {
                return Response.error("Chương này không có nội dung.");
            }
            return Response.success(content);
        }
        var errMsg = json.err || json.info || ("STV báo lỗi mã: " + json.code);
        if (isLoginRequired(errMsg, BASE_URL + "/truyen/" + host + "/1/" + bookid + "/")) {
            return Response.error(formatLoginError("Sáng Tác Việt", BASE_URL));
        }
        return Response.error(errMsg);
    }

    return Response.error("Phản hồi nội dung chương không hợp lệ.");
}
