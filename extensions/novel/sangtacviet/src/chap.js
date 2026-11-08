// chap.js — Doc noi dung chuong Sang Tac Viet
load('config.js');
load('challenge-handler.js');

// stvMd5 — Ham MD5 dung de ky request doc chuong (x-stv-sign).
//
// Ghi chu nguon: phan trien khai MD5 inline ben duoi (rotateLeft /
// addUnsigned / FF-GG-HH-II / convertToWordArray / wordToHex / utf8Encode)
// la thuat toan MD5 chuan RFC 1321 theo kieu trien khai md5.js kinh dien
// cua Paul Johnston (dang public-domain, pho bien rong rai). Chi chay khi
// runtime khong co san CryptoJS — runtime vBook da bundle CryptoJS (xem
// reference/runtime.md: "crypto.js always resolves to bundled CryptoJS")
// nen thuc te luon dung nhanh CryptoJS.MD5 o tren, nhanh inline chi la
// du phong. Giu lai nhanh du phong de chap van chay neu runtime doi.
function stvMd5(string) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        var lX4 = lX & 0x40000000;
        var lY4 = lY & 0x40000000;
        var lX8 = lX & 0x80000000;
        var lY8 = lY & 0x80000000;
        var lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
            return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        }
        return lResult ^ lX8 ^ lY8;
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return x ^ y ^ z; }
    function I(x, y, z) { return y ^ (x | (~z)); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(str) {
        var lWordCount;
        var lMessageLength = str.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = new Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }
    function wordToHex(lValue) {
        var wordToHexValue = "", wordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    }
    function utf8Encode(str) {
        str = str.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < str.length; n++) {
            var c = str.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }
    if (typeof CryptoJS !== "undefined" && CryptoJS && typeof CryptoJS.MD5 === "function") {
        return CryptoJS.MD5(string).toString();
    }
    var x = [];
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    string = utf8Encode(string);
    x = convertToWordArray(string);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
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

// Cho co gioi han (toi da 1200ms, goi dung 1 lan moi lan retry): uu tien
// ham sleep() cua runtime, roi toi java.lang.Thread.sleep, cuoi cung moi
// la vong busy-wait (chi la du phong, khong lap vo han).
function waitBounded(ms) {
    try {
        sleep(ms);
        return;
    } catch (e1) {}
    try {
        if (typeof java !== "undefined" && java && java.lang && java.lang.Thread) {
            java.lang.Thread.sleep(ms);
            return;
        }
    } catch (e2) {}
    var waitTarget = new Date().getTime() + ms;
    while (new Date().getTime() < waitTarget) {}
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
