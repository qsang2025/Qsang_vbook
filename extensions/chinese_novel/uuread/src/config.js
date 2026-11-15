// config.js — uu看書 (uuread.tw).
// Port tu alexsonxxx v1 (xem work/ext-review/zipcheck8/uuread.tw).
// Site dung Cloudflare: KHONG gan co dinh User-Agent (clearance cf_clearance
// cua nguoi dung gan voi UA cua trinh duyet trong app) — dung UA mac dinh
// cua runtime; cookie phien (gom cf_clearance) doc tu kho cookie cua app
// qua localCookie va gui kem header Cookie (mau medoctruyenchu #48).
// Khong co co che mo khoa VIP, khong gia lap dang nhap: chuong khong doc
// duoc tra loi tieng Viet ro rang o chap.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.uuread.tw";
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
    // ignore
}

// Rewrite an incoming url's host to BASE_URL, keeping path/query.
function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

// Map category name to its /sort/{id}/ listing path (9 the loai cua site).
function sortPath(category) {
    if (category.indexOf("玄幻") !== -1) return "/sort/1/1.html";
    if (category.indexOf("仙俠") !== -1) return "/sort/2/1.html";
    if (category.indexOf("都市") !== -1) return "/sort/3/1.html";
    if (category.indexOf("歷史") !== -1) return "/sort/4/1.html";
    if (category.indexOf("遊戲") !== -1) return "/sort/5/1.html";
    if (category.indexOf("科幻") !== -1) return "/sort/6/1.html";
    if (category.indexOf("靈異") !== -1) return "/sort/7/1.html";
    if (category.indexOf("言情") !== -1) return "/sort/8/1.html";
    if (category.indexOf("其它") !== -1) return "/sort/9/1.html";
    return "";
}

// Cookie phien cua app (gom cf_clearance neu nguoi dung da qua challenge
// trong trinh duyet cua app). Chi doc, khong luu gia tri that vao code.
function getAuthCookie() {
    try {
        var c = localCookie.getCookie();
        if (c && typeof c === "string" && c.trim().length > 0) {
            return c;
        }
    } catch (e) {
        // localCookie khong co san
    }
    return "";
}

// Fetch co pacing (1 request/lan, jitter, retry 429/405/503 toi da 3 lan,
// cooldown 60 phut khi bi chan) — xem file rate-limit.js.
// Tra ve response tho cua runtime khi thanh cong; khi loi tra ve shim co
// cung interface toi thieu (.ok/.status/.text()/.html()) de caller khong crash.
function fetchPage(url, options) {
    if (!options) options = {};
    var headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"
    };
    var cookie = getAuthCookie();
    if (cookie) {
        headers["Cookie"] = cookie;
    }
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }
    var pf = pacedFetch(url, {
        headers: headers,
        method: options.method || "GET",
        body: options.body
    });
    if (pf && pf.ok && pf.res) {
        return pf.res;
    }
    return {
        ok: false,
        status: (pf && pf.status) || 0,
        text: function() { return ""; },
        html: function() { return null; }
    };
}

// Fetch mot trang va parse thanh doc; phat hien trang challenge Cloudflare.
// Tra ve { ok, status, doc, challenge, cooldownMs }.
function fetchDoc(url, options) {
    var res = fetchPage(url, options);
    if (!res || !res.ok) {
        var st = (res && res.status) || 0;
        return { ok: false, status: st, doc: null, challenge: (st === 403), cooldownMs: 0 };
    }
    var doc = null;
    try { doc = res.html(); } catch (e) { doc = null; }
    if (!doc) {
        return { ok: false, status: res.status, doc: null, challenge: false, cooldownMs: 0 };
    }
    var challenge = false;
    try { challenge = isChallengeDoc(doc); } catch (e2) { challenge = false; }
    if (challenge) {
        return { ok: false, status: 403, doc: doc, challenge: true, cooldownMs: 0 };
    }
    return { ok: true, status: res.status, doc: doc, challenge: false, cooldownMs: 0 };
}

// Thong bao loi tieng Viet theo ma HTTP / trang thai chan.
function httpError(url, status, challenge, cooldownMs) {
    if (challenge) return formatChallengeError("uu看書", url);
    if (status === 403) return formatChallengeError("uu看書", url);
    if (status === 429 || status === 405) return rateLimitErrorMessage("uu看書", "www.uuread.tw", cooldownMs || 0);
    if (status) return "Không tải được trang (HTTP " + status + "): " + url;
    return "Không kết nối được tới uu看書: " + url;
}
