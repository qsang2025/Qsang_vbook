// config.js — Cau hinh chung va ham tien ich cho Tiem Truyen Chu
var BASE_URL = "https://tiemtruyenchu.cloud";
var USER_COOKIE = "";

try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = String(CONFIG_URL).replace(/\/+$/, "");
    } else if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

try {
    if (typeof COOKIE !== "undefined" && COOKIE) {
        USER_COOKIE = String(COOKIE).trim();
    }
} catch (e) {
}

if (BASE_URL.indexOf("tiemtruyenchu.com") !== -1) {
    BASE_URL = "https://tiemtruyenchu.cloud";
}

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    var s = String(url).trim();
    if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0) {
        s = s.replace(/^https?:\/\/(www\.)?tiemtruyenchu\.(com|cloud)/i, BASE_URL);
        return s;
    }
    if (s.charAt(0) === "/") {
        return BASE_URL + s;
    }
    return BASE_URL + "/" + s;
}

function extractStoryId(url) {
    if (!url) return "";
    var s = String(url).trim();
    var m = s.match(/\/truyen\/(\d+)/i);
    if (m && m[1]) return m[1];
    m = s.match(/\/doc-truyen\/(\d+)/i);
    if (m && m[1]) return m[1];
    m = s.match(/[?&]story_id=(\d+)/i);
    if (m && m[1]) return m[1];
    m = s.match(/\/stories\/(\d+)/i);
    if (m && m[1]) return m[1];
    if (/^\d+$/.test(s)) return s;
    return "";
}

function getSavedCookie() {
    if (USER_COOKIE) return USER_COOKIE;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            var c = localStorage.getItem("ttc_cookie");
            if (c) return String(c).trim();
        }
    } catch (e) {
    }
    return "";
}

function saveCookie(c) {
    if (!c) return;
    var s = String(c).trim();
    if (!s) return;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.setItem("ttc_cookie", s);
        }
    } catch (e) {
    }
}

function buildHeaders(extraCookie) {
    var headers = {
        "Accept": "application/json, text/html, */*;q=0.8",
        "Referer": BASE_URL + "/"
    };
    var ck = extraCookie || getSavedCookie();
    if (ck) {
        headers["Cookie"] = ck;
    }
    return headers;
}

function fetchJson(url, extraCookie) {
    var target = normalizeUrl(url);
    var res = fetch(target, {
        headers: buildHeaders(extraCookie)
    });
    if (!res || !res.ok) return null;
    try {
        return res.json();
    } catch (e) {
        try {
            return JSON.parse(res.text());
        } catch (e2) {
            return null;
        }
    }
}

function cleanText(str) {
    if (!str) return "";
    return String(str).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}
