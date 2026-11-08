// chap.js — Noi dung chuong Tiem Truyen Chu (API prefetch + Cookie + Engine.newBrowser fallback)
load('config.js');
load('challenge-handler.js');

function parseChapterInfo(url) {
    var s = String(url || "").trim();
    var m = s.match(/\/doc-truyen\/(\d+)\/chuong\/(\d+)/i);
    if (m && m[1] && m[2]) {
        return { storyId: m[1], chapNum: m[2] };
    }
    var ms = s.match(/[?&]story_id=(\d+)/i);
    var mc = s.match(/[?&]chapter_number=(\d+)/i);
    if (ms && ms[1] && mc && mc[1]) {
        return { storyId: ms[1], chapNum: mc[1] };
    }
    return null;
}

function formatPlainContent(text) {
    var s = cleanText(text);
    if (!s) return "";
    if (s.indexOf("<p>") !== -1 || s.indexOf("<br") !== -1) {
        return s;
    }
    // Doan van cach nhau boi dong trang -> <br><br>, xuong dong don trong
    // doan chi -> <br> (khong nhan doi moi lan xuong dong nhu truoc).
    var paras = s.split(/\n\s*\n/);
    for (var i = 0; i < paras.length; i++) {
        paras[i] = paras[i].replace(/\n/g, "<br>");
    }
    return paras.join("<br><br>");
}

function extractChapterFromDoc(doc) {
    if (!doc) return "";
    doc.select("script, style, noscript, ins, iframe, .ads, .ads-container, .ad-content, .quangcao").remove();
    var contentEl = doc.select("#chapter-body, .chapter-content, #chapter-content, .content-text, .chapter-c").first();
    if (!contentEl) return "";
    var html = contentEl.html();
    // Chi can noi dung khong rong la nhan (bo nguong cung 20 ky tu: chuong
    // ngan that van phai doc duoc); trang interstitial khong co #chapter-body
    // nen da tra "" o tren.
    if (!html || !cleanText(contentEl.text())) return "";
    return html;
}

function execute(url) {
    var info = parseChapterInfo(url);
    if (!info) {
        return Response.error("Không xác định được số chương từ đường dẫn. Hãy mở chương từ mục lục của truyện trên Tiệm Truyện Chữ rồi thử lại.");
    }
    var ck = getSavedCookie();

    // 1. Thu goi API doc chuong nhanh /api/prefetch-chapter (can Cookie neu co).
    // Chua dang nhap thi API tra 401 "Vui long dang nhap de tiep tuc!" — roi
    // xuong cac buoc duoi thay vi dung lai o day.
    var prefetchUrl = BASE_URL + "/api/prefetch-chapter/" + info.storyId + "/" + info.chapNum;
    var pJson = fetchJson(prefetchUrl, ck);
    var pContent = "";
    if (pJson) {
        pContent = pJson.content || (pJson.data && pJson.data.content) || "";
    }
    if (pContent && String(pContent).trim()) {
        return Response.success(formatPlainContent(pContent));
    }

    // 2. Tai trang HTML chuong truyen
    var chapUrl = BASE_URL + "/doc-truyen/" + info.storyId + "/chuong/" + info.chapNum;

    var res = null;
    try {
        res = fetch(chapUrl, { headers: buildHeaders(ck) });
    } catch (eFetch) {
        res = null;
    }
    if (res && res.ok) {
        var rawHtml = String(res.text() || "");
        if (isCloudflareChallenge(rawHtml, res.headers)) {
            return Response.error(formatChallengeError("Tiệm Truyện Chữ", chapUrl));
        }
        var doc = Html.parse(rawHtml);
        if (!isInterstitialDoc(doc)) {
            var bodyHtml = extractChapterFromDoc(doc);
            if (bodyHtml) {
                return Response.success(bodyHtml);
            }
        }
        }
    }

    // 3. Fallback Engine.newBrowser() de lay phien dang nhap tu trinh duyet vBook
    var browser = null;
    var bDoc = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(chapUrl, 10000);
        try {
            var cookieRes = browser.callJs("document.cookie;", 1000);
            if (cookieRes) {
                // callJs tra ve HtmlElement — lay chuoi cookie that bang .text(),
                // khong dung String() (se luu rac).
                var rawCookie = "";
                try {
                    rawCookie = cookieRes.text();
                } catch (eText) {
                    rawCookie = String(cookieRes);
                }
                if (rawCookie && rawCookie.indexOf("=") !== -1) {
                    saveCookie(rawCookie);
                }
            }
        } catch (eCookie) {
        }
        bDoc = browser.html();
    } catch (eBrowser) {
    } finally {
        if (browser) {
            try {
                browser.close();
            } catch (eClose) {
            }
        }
    }
    if (bDoc && isChallengeDoc(bDoc)) {
        return Response.error(formatChallengeError("Tiệm Truyện Chữ", chapUrl));
    }
    if (bDoc && !isInterstitialDoc(bDoc)) {
        var bHtml = extractChapterFromDoc(bDoc);
        if (bHtml) {
            return Response.success(bHtml);
        }
    }

    return Response.error(formatLoginError("Tiệm Truyện Chữ", chapUrl));
}
