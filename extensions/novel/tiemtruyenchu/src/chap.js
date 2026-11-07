// chap.js — Noi dung chuong Tiem Truyen Chu (API + Cookie + Engine.newBrowser fallback)
load('config.js');

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
    return s.replace(/\n+/g, "<br><br>");
}

function extractChapterFromDoc(doc) {
    if (!doc) return "";
    doc.select("script, style, noscript, ins, iframe, .ads, .ads-container, .ad-content, .quangcao").remove();
    var contentEl = doc.select("#chapter-body, .chapter-content, #chapter-content, .content-text, .chapter-c").first();
    if (!contentEl) return "";
    var html = contentEl.html();
    if (!html || cleanText(contentEl.text()).length < 20) return "";
    return html;
}

function execute(url) {
    var info = parseChapterInfo(url);
    var ck = getSavedCookie();

    // 1. Thu goi API doc chuong nhanh neu co storyId va chapNum
    if (info) {
        var prefetchUrl = BASE_URL + "/api/prefetch-chapter/" + info.storyId + "/" + info.chapNum;
        var pJson = fetchJson(prefetchUrl, ck);
        if (pJson && pJson.content && String(pJson.content).trim().length > 20) {
            return Response.success(formatPlainContent(pJson.content));
        }

        var apiContentUrl = BASE_URL + "/api/v1/chapters/content?story_id=" + info.storyId + "&chapter_number=" + info.chapNum;
        var cJson = fetchJson(apiContentUrl, ck);
        if (cJson) {
            var rawText = cJson.content || (cJson.data && cJson.data.content) || (cJson.chapter && cJson.chapter.content) || "";
            if (rawText && String(rawText).trim().length > 20) {
                return Response.success(formatPlainContent(rawText));
            }
        }
    }

    // 2. Tai trang HTML chuong truyen
    var chapUrl = info
        ? (BASE_URL + "/doc-truyen/" + info.storyId + "/chuong/" + info.chapNum)
        : normalizeUrl(url);

    var res = fetch(chapUrl, { headers: buildHeaders(ck) });
    if (res && res.ok) {
        var doc = res.html();
        var bodyHtml = extractChapterFromDoc(doc);
        if (bodyHtml) {
            return Response.success(bodyHtml);
        }
    }

    // 3. Fallback Engine.newBrowser() de lay phien dang nhap tu trinh duyet vBook
    try {
        var browser = Engine.newBrowser();
        browser.launch(chapUrl, 10000);
        try {
            var cookieRes = browser.callJs("document.cookie;", 1000);
            if (cookieRes && String(cookieRes).indexOf("=") !== -1) {
                saveCookie(String(cookieRes));
            }
        } catch (eCookie) {
        }
        var bDoc = browser.html();
        browser.close();

        var bHtml = extractChapterFromDoc(bDoc);
        if (bHtml) {
            return Response.success(bHtml);
        }
    } catch (eBrowser) {
    }

    return Response.error("Tiệm Truyện Chữ yêu cầu đăng nhập tài khoản để đọc nội dung chương. Vui lòng mở Trình duyệt trong vBook truy cập https://tiemtruyenchu.cloud/login để đăng nhập hoặc điền Cookie vào phần Cài đặt nguồn.");
}
