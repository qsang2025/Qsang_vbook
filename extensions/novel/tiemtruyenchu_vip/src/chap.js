// chap.js — Nội dung chương Tiệm Truyện Chữ VIP (Web API prefetch + Mobile API Bearer + Auto-Unlock Upstream)
load('config.js');
load('challenge-handler.js');

// Bảng map các truyện VIP phổ biến trên Tiệm Truyện Chữ sang ID kho raw
var KNOWN_UPSTREAM_STORIES = {
    "3094": { bookId: "644862", title: "Cái Trò Chơi Này Không Thích Hợp, Ta Đào Quáng Thành Thần!" }
};

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

function translateZhToVi(text) {
    if (!text || !String(text).trim()) return "";
    var encoded = encodeURIComponent(String(text).trim());
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=" + encoded;
    try {
        var res = fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        if (res && res.ok) {
            var raw = res.text();
            var json = JSON.parse(raw);
            if (json && json[0] && json[0].length) {
                var out = "";
                for (var i = 0; i < json[0].length; i++) {
                    if (json[0][i] && json[0][i][0]) {
                        out += json[0][i][0];
                    }
                }
                return out;
            }
        }
    } catch (eTrans) {
    }
    return text;
}

function autoUnlockFromUpstream(storyId, chapNum) {
    var bookId = "";
    if (KNOWN_UPSTREAM_STORIES[String(storyId)]) {
        bookId = KNOWN_UPSTREAM_STORIES[String(storyId)].bookId;
    }

    if (!bookId) {
        try {
            var sInfo = fetchJson(BASE_URL + "/api/v1/stories/" + storyId);
            var title = (sInfo && sInfo.story && sInfo.story.title) || "";
            if (title) {
                var searchUrl = "https://ixdzs8.com/bsearch?q=" + encodeURIComponent(title);
                var sRes = fetch(searchUrl, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
                });
                if (sRes && sRes.ok) {
                    var sHtml = sRes.text();
                    var mBook = sHtml.match(/href=[\"']\/read\/(\d+)\/[\"']/i);
                    if (mBook && mBook[1]) {
                        bookId = mBook[1];
                    }
                }
            }
        } catch (eSearch) {}
    }

    if (!bookId) return null;

    var targetUrl = "https://ixdzs8.com/read/" + bookId + "/p" + chapNum + ".html";
    var cRes = null;
    try {
        cRes = fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
    } catch (eFetch) {
        return null;
    }
    if (!cRes || !cRes.ok) return null;

    var html = cRes.text();
    var artMatch = html.match(/<article[^>]*class=[\"']page-content[\"'][^>]*>([\s\S]*?)<\/article>/i);
    if (!artMatch || !artMatch[1]) return null;

    var rawArticle = artMatch[1];
    var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || rawArticle.match(/<h3>([\s\S]*?)<\/h3>/i);
    var rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    var chapTitle = "";
    if (rawTitle) {
        chapTitle = translateZhToVi(rawTitle);
    }

    var pMatches = rawArticle.match(/<p>([\s\S]*?)<\/p>/gi);
    if (!pMatches || pMatches.length === 0) return null;

    var paras = [];
    for (var i = 0; i < pMatches.length; i++) {
        var cleanP = pMatches[i].replace(/<[^>]+>/g, "").trim();
        if (cleanP) paras.push(cleanP);
    }

    var chunks = [];
    var cur = "";
    for (var j = 0; j < paras.length; j++) {
        if (cur.length + paras[j].length > 1800) {
            chunks.push(cur);
            cur = paras[j];
        } else {
            if (cur) cur += "\n" + paras[j];
            else cur = paras[j];
        }
    }
    if (cur) chunks.push(cur);

    var finalHtml = [];
    for (var k = 0; k < chunks.length; k++) {
        var trans = translateZhToVi(chunks[k]);
        var lines = trans.split("\n");
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l].trim();
            if (line) {
                finalHtml.push("<p>" + line + "</p>");
            }
        }
    }

    if (finalHtml.length === 0) return null;

    return {
        content: finalHtml.join(""),
        title: chapTitle || ("Chương " + chapNum)
    };
}

function execute(url) {
    var info = parseChapterInfo(url);
    if (!info) {
        return Response.error("Không xác định được số chương từ đường dẫn. Hãy mở chương từ mục lục truyện rồi thử lại.");
    }
    var ck = getSavedCookie();

    // 1. Tuyến chính: Gọi Web API prefetch với Cookie phiên tài khoản Full VIP
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

    // 1.5. Tuyến Native Mobile API: POST /api/v1/chapters/content kèm Bearer token
    var token = getSavedToken();
    if (token) {
        try {
            var mRes = fetch(BASE_URL + "/api/v1/chapters/content", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token,
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
                },
                body: JSON.stringify({
                    storyId: parseInt(info.storyId, 10),
                    chapterNumber: parseInt(info.chapNum, 10)
                })
            });
            if (mRes && mRes.ok) {
                var mJson = mRes.json();
                var mContent = mJson ? (mJson.content || (mJson.data && mJson.data.content) || "") : "";
                var mTitle = mJson ? (mJson.title || mJson.chapter_title || (mJson.data && mJson.data.title) || "") : "";
                if (mContent && String(mContent).trim()) {
                    if (mTitle && String(mTitle).trim()) {
                        return Response.success(formatPlainContent(mContent), String(mTitle).trim());
                    }
                    return Response.success(formatPlainContent(mContent));
                }
            }
        } catch (eMobile) {}
    }

    // 2. Tuyến HTML trực tiếp
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
            return Response.error(formatChallengeError("Tiệm Truyện Chữ VIP", chapUrl));
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

    // 3. TUYẾN TỰ ĐỘNG MỞ KHÓA (Auto-Unlock): Khi web bị khóa VIP hoặc chưa đồng bộ cookie/token
    if (AUTO_UNLOCK_VIP === "true") {
        var unlocked = autoUnlockFromUpstream(info.storyId, info.chapNum);
        if (unlocked && unlocked.content) {
            return Response.success(unlocked.content, unlocked.title);
        }
    }

    // 4. Fallback Engine.newBrowser() để kích hoạt phiên đăng nhập nếu có
    if (typeof Engine !== "undefined" && Engine && typeof Engine.newBrowser === "function") {
        var browser = null;
        var bDoc = null;
        try {
            browser = Engine.newBrowser();
            bDoc = browser.launch(chapUrl, 10000);

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
            return Response.error(formatChallengeError("Tiệm Truyện Chữ VIP", chapUrl));
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

    return Response.error(formatLoginError("Tiệm Truyện Chữ VIP", chapUrl));
}
