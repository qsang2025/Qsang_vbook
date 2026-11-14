// config.js — Cau hinh cho extension NovelCooksTW (novel.cooks.tw).
//
// Site Dai Loan (truyen chu tieng Trung phon the), API JSON cong khai
// /api/novel/... + /api/chapter/... (kiem chung tu VM 2026-11-14: hot,
// list, search, detail, toc, chap deu tra code 200, khong can dang nhap,
// khong Cloudflare challenge; 6 truyen mau kiem tra deu 0 chuong VIP).
// Khong dung User-Agent rieng — API tra 200 ca khi khong gui UA (kiem
// chung 2026-11-14), theo quy tac 10 AGENTS.md. Anh bia nam o
// pic.cooks.tw/<id/1000>/<id>/<id>s.webp (kiem chung 200).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file rate-limit.js, file helper.js
// (helper.js chi dung cho search.js — tu dien Viet-Trung + dich tu khoa).

var BASE_URL = "https://novel.cooks.tw";

// Domain co the doi trong cai dat nguon (novel.cooks.tw mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror nao duoc kiem chung song (chi co 1 domain).
var MIRROR_LIST = [];

var API_BASE = BASE_URL + "/api";
var API_TIMEOUT = 25000;
var API_CACHE_TTL = 30000;
var PIC_BASE = "https://pic.cooks.tw";

function apiUrl(path) {
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    return API_BASE + path + sep + "lang=zh-TW";
}

function parseJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

// Phat hien trang Cloudflare JS Challenge (chi dung khi body khong phai JSON).
function isCloudflareChallenge(text) {
    if (!text) return false;
    var sample = text.substring(0, 4000).toLowerCase();
    if (sample.indexOf("just a moment") >= 0) return true;
    if (sample.indexOf("attention required") >= 0) return true;
    if (sample.indexOf("cf-chl") >= 0) return true;
    if (sample.indexOf("you have been blocked") >= 0) return true;
    return sample.indexOf("cloudflare") >= 0 && sample.indexOf("ray id") >= 0;
}

// Doi host cua URL ve BASE_URL khi URL tro toi site (vd. URL cu tu
// ket qua tim kiem mang host khac). URL ngoai site giu nguyen.
function normalizeUrl(url) {
    url = String(url || "");
    if (!url) return url;
    if (url.indexOf("novel.cooks.tw") !== -1) {
        url = url.replace(/^https?:\/\/[^\/]+/, BASE_URL);
    }
    return url;
}

// Goi API 1 lan (da pacing qua file rate-limit.js khi script co tai
// file do; neu khong thi fetch thuong). Tra ve { json } hoac
// { error, status, cf, retryable }.
function fetchOnce(url) {
    var r = null;
    if (typeof pacedFetch === "function") {
        r = pacedFetch(url, { timeout: API_TIMEOUT });
        if (r && r.error === "cooldown") {
            var remain = r.cooldownRemainingMs || 0;
            var msg = "May chu tam chan truy cap, thu lai sau ";
            if (typeof rateLimitErrorMessage === "function") {
                msg = rateLimitErrorMessage("novel.cooks.tw", "novel.cooks.tw", remain);
            } else {
                msg += Math.ceil(remain / 60000) + " phut";
            }
            return { error: msg, status: 0, retryable: false, cooldown: true };
        }
        if (!r || !r.ok) {
            var status = (r && r.status) || 0;
            var errorText = "";
            try {
                if (r && r.res) errorText = r.res.text();
            } catch (e2) {}
            var isCf = isCloudflareChallenge(errorText);
            return {
                error: isCf ? "Cloudflare chan truy cap (HTTP " + status + ")" : "HTTP " + status,
                status: status,
                retryable: isCf || status === 0 || status >= 500,
                cf: isCf
            };
        }
        var text = "";
        try {
            text = r.res.text();
        } catch (e3) {
            text = "";
        }
        var json = parseJson(text);
        if (json) return { json: json };
        if (isCloudflareChallenge(text)) {
            return { error: "Cloudflare chan truy cap", status: r.status, retryable: true, cf: true };
        }
        return { error: "Phan hoi khong phai JSON (HTTP " + r.status + ")", status: r.status, retryable: false };
    }

    // Du phong khi script khong tai file rate-limit.js.
    var res = null;
    try {
        res = fetch(url, { timeout: API_TIMEOUT });
    } catch (e4) {
        return { error: "Khong ket noi duoc may chu", status: 0, retryable: true };
    }
    if (!res) return { error: "Khong ket noi duoc may chu", status: 0, retryable: true };
    if (!res.ok) {
        var st = res.status || 0;
        var et = "";
        try {
            et = res.text();
        } catch (e5) {}
        var isCf2 = isCloudflareChallenge(et);
        return {
            error: isCf2 ? "Cloudflare chan truy cap (HTTP " + st + ")" : "HTTP " + st,
            status: st,
            retryable: isCf2 || st === 0 || st >= 500,
            cf: isCf2
        };
    }
    var text2 = "";
    try {
        text2 = res.text();
    } catch (e6) {
        text2 = "";
    }
    var json2 = parseJson(text2);
    if (json2) return { json: json2 };
    if (isCloudflareChallenge(text2)) {
        return { error: "Cloudflare chan truy cap", status: res.status, retryable: true, cf: true };
    }
    return { error: "Phan hoi khong phai JSON (HTTP " + res.status + ")", status: res.status, retryable: false };
}

function getCachedApiResult(key) {
    try {
        var cached = parseJson(cacheStorage.getItem(key));
        if (cached && cached.expires > Date.now() && cached.json && cached.json.code === 200) {
            return { json: cached.json };
        }
    } catch (e) {
        return null;
    }
    return null;
}

function cacheApiResult(key, result) {
    if (!result || !result.json || result.json.code !== 200) return;
    try {
        cacheStorage.setItem(key, JSON.stringify({
            expires: Date.now() + API_CACHE_TTL,
            json: result.json
        }));
    } catch (e) {
    }
}

// Tra ve { json } hoac { error, status, cf, retryable }.
function fetchApi(path, useCache) {
    var url = apiUrl(path);
    var cacheKey = "novelcookstw:" + url;
    if (useCache) {
        var cached = getCachedApiResult(cacheKey);
        if (cached) return cached;
    }

    var result = fetchOnce(url);
    if (result.json) {
        if (useCache) cacheApiResult(cacheKey, result);
        return result;
    }

    if (result.retryable && !result.cf) result = fetchOnce(url);
    if (result.json) {
        if (useCache) cacheApiResult(cacheKey, result);
        return result;
    }

    return result;
}

function coverUrl(id) {
    var n = parseInt(id, 10);
    if (!n) return "";
    var sub = Math.floor(n / 1000);
    return PIC_BASE + "/" + sub + "/" + n + "/" + n + "s.webp";
}

function makeChapUrl(articleId, chapterId) {
    return BASE_URL + "/reader.html?articleid=" + articleId + "&chapterid=" + chapterId;
}

function parseArticleId(url) {
    var m = String(url || "").match(/[?&]articleid=(\d+)/);
    return m ? m[1] : null;
}

function parseChapterId(url) {
    var m = String(url || "").match(/[?&]chapterid=(\d+)/);
    return m ? m[1] : null;
}

function buildItems(items, limit) {
    var result = [];
    if (!items) return result;
    var len = (limit && limit < items.length) ? limit : items.length;
    for (var i = 0; i < len; i++) {
        var n = items[i];
        if (!n) continue;
        var id = n.articleid || n.my_novel_id;
        var name = n.articlename || n.title || "";
        if (!id || !name) continue;
        result.push({
            name: name,
            link: BASE_URL + "/novel.html?articleid=" + id,
            host: BASE_URL,
            cover: coverUrl(id),
            description: n.intro || n.author || ""
        });
    }
    return result;
}

function textToHtml(text) {
    if (!text) return "";
    var lines = text.split(/\r?\n/);
    var html = "";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line) html += "<p>" + line + "</p>";
    }
    return html;
}
