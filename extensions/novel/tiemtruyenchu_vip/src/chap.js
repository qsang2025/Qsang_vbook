// chap.js — Nội dung chương Tiệm Truyện Chữ VIP (Web API prefetch + Mobile API Bearer + Auto-Unlock Upstream, trả nguyên văn tiếng Trung)
load('config.js');
load('challenge-handler.js');
load('hanviet.js');

// Bảng map ghi đè: truyện nào tên thuần Việt không chuyển được sang Hán-Việt
// (vd. Cái Trò Chơi Này Không Thích Hợp...) thì ghi sẵn ở đây. Các truyện
// khác tự phân giải qua chuyển tên Hán-Việt + tìm kiếm (xem hanviet.js).
var KNOWN_UPSTREAM_STORIES = {
    "3094": { bookId: "644862", title: "Cái Trò Chơi Này Không Thích Hợp, Ta Đào Quáng Thành Thần!" },
    "3703": { bookId: "646492", title: "Quỷ Bí Chi Chủ" },
    "669": { bookId: "492266", title: "Bắt Đầu Trường Sinh Vạn Cổ, Cẩu Đến Thiên Hoang Địa Lão" }
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

// Chuyển số chương viết bằng chữ Hán ("一百", "五十二", "一千二百三十四") sang số.
function zhNumeralToInt(s) {
    var digit = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "两": 2, "零": 0};
    var unit = {"十": 10, "百": 100, "千": 1000, "万": 10000};
    var total = 0;
    var num = 0;
    for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (digit[c] !== undefined) {
            num = digit[c];
        } else if (unit[c] !== undefined) {
            if (num === 0) num = 1;
            total += num * unit[c];
            num = 0;
        }
    }
    total += num;
    return total;
}

// Lấy số chương trong tiêu đề tiếng Trung ("第N章 ..." hoặc "第...章" viết
// bằng chữ Hán như "第一百章", "第五十二章") (-1 nếu không có).
function chapterNumberFromZhTitle(t) {
    var s = String(t || "");
    var m = s.match(/第\s*(\d+)\s*章/);
    if (m) return parseInt(m[1], 10);
    var m2 = s.match(/第\s*([一二三四五六七八九十百千万两零]+)\s*章/);
    if (m2) return zhNumeralToInt(m2[1]);
    return -1;
}

// Số chương HIỂN THỊ của chương (lấy từ tiêu đề TTC "Chương D: ...").
// API TTC đánh số chương (chapterNumber) lệch với số trong tiêu đề — ví dụ
// truyện 669: API 1451 nhưng tiêu đề là "Chương 1462: Niết Bàn", và chương
// tiếng Trung đúng cũng là 第1462章. Không có số trong tiêu đề thì dùng API.
function displayChapterNumber(storyId, apiNum) {
    try {
        var sInfo = fetchJson(BASE_URL + "/api/v1/stories/" + storyId);
        var chs = (sInfo && sInfo.chapters) || [];
        for (var i = 0; i < chs.length; i++) {
            if (String(chs[i].chapterNumber) === String(apiNum)) {
                var m = String(chs[i].title || "").match(/Chương\s+0*(\d+)/i);
                if (m && m[1]) return parseInt(m[1], 10);
                break;
            }
        }
    } catch (eDisp) {}
    return parseInt(apiNum, 10);
}

// Tải một trang chương trên ixdzs8, trả {title, h1Num, paras} hoặc null.
function fetchUpstreamPage(bookId, pageNum) {
    var url = "https://ixdzs8.com/read/" + bookId + "/p" + pageNum + ".html";
    var res = null;
    try {
        res = fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
    } catch (eFetch) {
        return null;
    }
    if (!res || !res.ok) return null;
    var html = res.text();
    var artMatch = html.match(/<article[^>]*class=[\"']page-content[\"'][^>]*>([\s\S]*?)<\/article>/i);
    if (!artMatch || !artMatch[1]) return null;
    var rawArticle = artMatch[1];
    var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || rawArticle.match(/<h3>([\s\S]*?)<\/h3>/i);
    var rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    var pMatches = rawArticle.match(/<p>([\s\S]*?)<\/p>/gi);
    if (!pMatches || pMatches.length === 0) return null;
    var paras = [];
    for (var i = 0; i < pMatches.length; i++) {
        var cleanP = pMatches[i].replace(/<[^>]+>/g, "").trim();
        if (cleanP) paras.push(cleanP);
    }
    if (paras.length === 0) return null;
    return { title: rawTitle, h1Num: chapterNumberFromZhTitle(rawTitle), paras: paras };
}

function autoUnlockFromUpstream(storyId, chapNum) {
    // Phân giải sang bookId ixdzs8: bảng map cứng -> cache -> chuyển tên
    // Hán-Việt + tìm kiếm có đối chiếu tên thật (xem hanviet.js).
    var bookId = "";
    try {
        var sInfo = fetchJson(BASE_URL + "/api/v1/stories/" + storyId);
        var viTitle = (sInfo && sInfo.story && sInfo.story.title) || "";
        bookId = resolveUpstreamBookId(storyId, viTitle);
    } catch (eResolve) {}

    if (!bookId) return null;

    // Số chương tiếng Trung đánh theo số HIỂN THỊ trong tiêu đề TTC, và số
    // trang trên ixdzs8 còn lệch với số chương (truyện 3703 lệch +1, truyện
    // 669 lệch +16): lấy trang p{D}, đọc số chương thật trong <h1>, lệch
    // bao nhiêu thì nhảy đúng bấy nhiêu trang rồi kiểm chứng lại. Không
    // khớp được thì trả null chứ không trả nhầm chương.
    var dispNum = displayChapterNumber(storyId, chapNum);
    var page = fetchUpstreamPage(bookId, dispNum);
    if (!page) return null;
    if (page.h1Num !== -1 && page.h1Num !== dispNum) {
        var offset = page.h1Num - dispNum;
        var corrected = dispNum - offset;
        var found = null;
        if (corrected > 0 && corrected !== dispNum) {
            var c2 = fetchUpstreamPage(bookId, corrected);
            if (c2 && c2.h1Num === dispNum) found = c2;
        }
        if (!found && corrected > 0) {
            var tries = [corrected - 2, corrected - 1, corrected + 1, corrected + 2];
            for (var t = 0; t < tries.length; t++) {
                if (tries[t] <= 0 || tries[t] === dispNum || tries[t] === corrected) continue;
                var c3 = fetchUpstreamPage(bookId, tries[t]);
                if (c3 && c3.h1Num === dispNum) { found = c3; break; }
            }
        }
        if (found) {
            page = found;
        } else {
            return null;
        }
    }

    // Trả nguyên văn tiếng Trung, không dịch máy — người dùng tự dịch cho chuẩn.
    var finalHtml = [];
    for (var k = 0; k < page.paras.length; k++) {
        finalHtml.push("<p>" + page.paras[k] + "</p>");
    }

    return {
        content: finalHtml.join(""),
        title: page.title || ("Chương " + chapNum)
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

    // 3. TUYẾN TỰ ĐỘNG MỞ KHÓA (Auto-Unlock): Khi web bị khóa VIP hoặc chưa đồng bộ cookie/token — trả nguyên văn tiếng Trung, không dịch máy.
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
