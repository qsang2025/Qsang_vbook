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
    if (!html || !cleanText(contentEl.text())) return "";
    return html;
}

function extractChapterTitleFromDoc(doc) {
    if (!doc) return "";
    try {
        var t = doc.select(".chapter-title, #chapter-title, h1.title, h2.title").text();
        if (t && String(t).trim()) return String(t).trim();
    } catch (e) {}
    return "";
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
    var pTitle = "";
    if (pJson) {
        pContent = pJson.content || (pJson.data && pJson.data.content) || "";
        pTitle = pJson.title || pJson.chapter_title || (pJson.chapter && pJson.chapter.title) || (pJson.data && (pJson.data.title || pJson.data.chapter_title)) || "";
    }
    if (pContent && String(pContent).trim()) {
        if (pTitle && String(pTitle).trim()) {
            return Response.success(formatPlainContent(pContent), String(pTitle).trim());
        }
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
                var docTitle = extractChapterTitleFromDoc(doc);
                if (docTitle) {
                    return Response.success(bodyHtml, docTitle);
                }
                return Response.success(bodyHtml);
            }
        }
    }

    // 3. Fallback Engine.newBrowser() de lay phien dang nhap tu trinh duyet vBook
    if (typeof Engine !== "undefined" && Engine && typeof Engine.newBrowser === "function") {
        var browser = null;
        var bDoc = null;
        try {
            browser = Engine.newBrowser();
            bDoc = browser.launch(chapUrl, 10000);
            try {
                var cookieRes = browser.callJs("document.cookie;", 1000);
                if (cookieRes) {
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
            } catch (eCookie) {}

            // Kiem tra lai cookie trong CookieManager sau khi browser launch
            var freshCookie = getSavedCookie();
            if (freshCookie && freshCookie !== ck) {
                var retryJson = fetchJson(prefetchUrl, freshCookie);
                var rContent = retryJson ? (retryJson.content || (retryJson.data && retryJson.data.content) || "") : "";
                var rTitle = retryJson ? (retryJson.title || retryJson.chapter_title || (retryJson.chapter && retryJson.chapter.title) || "") : "";
                if (rContent && String(rContent).trim()) {
                    if (rTitle && String(rTitle).trim()) {
                        return Response.success(formatPlainContent(rContent), String(rTitle).trim());
                    }
                    return Response.success(formatPlainContent(rContent));
                }
            }

            if (!bDoc) {
                bDoc = browser.html();
            }
        } catch (eBrowser) {
        } finally {
            if (browser) {
                try {
                    browser.close();
                } catch (eClose) {}
            }
        }

        if (bDoc && isChallengeDoc(bDoc)) {
            return Response.error(formatChallengeError("Tiệm Truyện Chữ", chapUrl));
        }
        if (bDoc && !isInterstitialDoc(bDoc)) {
            var bHtml = extractChapterFromDoc(bDoc);
            if (bHtml) {
                var bTitle = extractChapterTitleFromDoc(bDoc);
                if (bTitle) {
                    return Response.success(bHtml, bTitle);
                }
                return Response.success(bHtml);
            }
        }
    }

    return Response.error(formatLoginError("Tiệm Truyện Chữ", chapUrl));
}
