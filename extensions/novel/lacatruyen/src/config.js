// config.js — Cau hinh chung va ham tien ich cho La Ca Truyen (lacatruyen.site)
// QUY TAC: File nay duoc load() vao cac script khac nen TUYET DOI KHONG goi load() o day.

var BASE_URL = "https://lacatruyen.site";
var CDN_URL = "https://cms.metruyen.com/storage/uploads/";
var MASTER_KEY = "T5Vv41K5zJBHhtODBnOTdrl3shZVEPqzb16Hzfuh4J5tWrb0";
var USER_TOKEN = "";

try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = String(CONFIG_URL).replace(/\/+$/, "");
    } else if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

try {
    if (typeof TOKEN !== "undefined" && TOKEN) {
        USER_TOKEN = normalizeToken(TOKEN);
    } else if (typeof CONFIG_COOKIE !== "undefined" && CONFIG_COOKIE) {
        USER_TOKEN = normalizeToken(CONFIG_COOKIE);
    }
} catch (e) {
}

function normalizeToken(rawVal) {
    if (!rawVal) return "";
    var s = String(rawVal).trim();
    if (!s) return "";
    var m = s.match(/(?:^|;\s*)token=([^;]+)/i);
    if (m && m[1]) {
        return String(m[1]).trim();
    }
    return s.replace(/^token=/i, "").trim();
}

function getSavedToken() {
    if (USER_TOKEN) return USER_TOKEN;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            var t = localStorage.getItem("laca_token");
            if (t) return normalizeToken(t);
        }
    } catch (e) {
    }
    return "";
}

function saveToken(t) {
    var clean = normalizeToken(t);
    if (!clean) return;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.setItem("laca_token", clean);
        }
    } catch (e) {
    }
}

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    var s = String(url).trim();
    if (!s) return BASE_URL;
    if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0) {
        s = s.replace(/^https?:\/\/(www\.|m\.)?lacatruyen\.(site|com|live|homes|store|online|biz|art|buzz|world|life|casa|bar|shop|pro|net|me|club|xyz|info|vip)/i, BASE_URL);
        return s.replace(/\/store\/story\//i, "/story/");
    }
    if (s.indexOf("//") === 0) {
        return "https:" + s;
    }
    if (s.charAt(0) === "/") {
        return BASE_URL + s.replace(/^\/store\/story\//i, "/story/");
    }
    return BASE_URL + "/" + s;
}

function resolveCover(img) {
    if (!img) return "";
    var s = String(img).trim();
    if (!s) return "";
    if (s.indexOf("/_next/image") === 0) {
        var m = s.match(/[?&]url=([^&]+)/i);
        if (m && m[1]) {
            try {
                s = decodeURIComponent(m[1]);
            } catch (e) {
            }
        }
    }
    if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0) {
        return s;
    }
    if (s.indexOf("//") === 0) {
        return "https:" + s;
    }
    if (s.indexOf("/storage/uploads/") === 0) {
        return "https://cms.metruyen.com" + s;
    }
    if (s.indexOf("storage/uploads/") === 0) {
        return "https://cms.metruyen.com/" + s;
    }
    return CDN_URL + s.replace(/^\/+/, "");
}

function buildAuthHeaders(extraHeaders) {
    var headers = {
        "Accept": "application/json, text/html, */*;q=0.8",
        "Origin": BASE_URL,
        "Referer": BASE_URL + "/"
    };
    var tk = getSavedToken();
    if (tk) {
        headers["Cookie"] = "token=" + tk;
    }
    if (extraHeaders && typeof extraHeaders === "object") {
        for (var k in extraHeaders) {
            if (Object.prototype.hasOwnProperty.call(extraHeaders, k)) {
                headers[k] = extraHeaders[k];
            }
        }
    }
    return headers;
}

function extractNextData(docOrHtml) {
    if (!docOrHtml) return null;
    if (typeof docOrHtml === "object" && typeof docOrHtml.select === "function") {
        try {
            var el = docOrHtml.select("script#__NEXT_DATA__").first();
            if (el) {
                var raw = String(el.html() || el.text() || "").trim();
                if (raw) return JSON.parse(raw);
            }
        } catch (e) {
        }
        try {
            docOrHtml = String(docOrHtml.html() || "");
        } catch (e2) {
            docOrHtml = "";
        }
    }
    var html = String(docOrHtml || "");
    var m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (m && m[1]) {
        try {
            return JSON.parse(m[1]);
        } catch (e3) {
        }
    }
    return null;
}

function translateStatus(st) {
    var v = String(st || "").trim().toLowerCase();
    if (v === "complete" || v === "completed" || v === "full") return "Hoàn thành";
    if (v === "coming" || v === "updating" || v === "ongoing") return "Đang ra";
    if (v === "drop") return "Tạm dừng";
    return st ? String(st) : "Đang ra";
}

function pickAuthor(item) {
    if (!item) return "Đang cập nhật";
    var a = item.pen_name_user || item.name_user || item.author_pen_name || item.author_name || item.story_author || item.author || "";
    a = String(a).trim();
    return a || "Đang cập nhật";
}

function mapStoryItem(raw) {
    if (!raw) return null;
    var item = (raw.story && typeof raw.story === "object") ? raw.story : raw;
    var name = String(item.story_title || item.title || item.name || "").trim();
    var slug = String(item.story_slug || item.slug || "").trim();
    if (!name || !slug) return null;

    var link = slug.indexOf("http") === 0 ? normalizeUrl(slug) : (BASE_URL + "/story/" + slug.replace(/^\/+/, ""));
    var cover = resolveCover(item.story_image || item.image || raw.story_image || raw.image || "");
    var author = pickAuthor(item);
    var chapCount = parseInt(item.count_chap || item.count_chapter || item.chapter_count || 0, 10);
    var status = translateStatus(item.story_status || item.status || "");

    var descParts = [];
    if (author && author !== "Đang cập nhật") descParts.push(author);
    if (!isNaN(chapCount) && chapCount > 0) descParts.push(chapCount + " chương");
    if (status) descParts.push(status);

    return {
        name: name,
        link: link,
        cover: cover,
        description: descParts.join(" · ") || author,
        host: BASE_URL
    };
}

function stripQueryAndHash(url) {
    if (!url) return "";
    return String(url).replace(/[?#].*$/, "");
}

function getQueryParam(url, key) {
    if (!url || !key) return "";
    var s = String(url);
    var qIdx = s.indexOf("?");
    if (qIdx === -1) return "";
    var hIdx = s.indexOf("#", qIdx);
    var query = s.substring(qIdx + 1, hIdx >= 0 ? hIdx : s.length);
    var parts = query.split("&");
    for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        if (kv[0] === key) {
            try {
                return decodeURIComponent(kv.slice(1).join("="));
            } catch (e) {
                return kv.slice(1).join("=");
            }
        }
    }
    return "";
}

function aesEncrypt(plainText, pass) {
    if (plainText === undefined || plainText === null) return "";
    var key = pass || MASTER_KEY;
    try {
        return CryptoJS.AES.encrypt(String(plainText), String(key)).toString();
    } catch (e) {
        return "";
    }
}

function aesDecrypt(cipherText, pass) {
    if (!cipherText) return "";
    var key = pass || MASTER_KEY;
    try {
        var bytes = CryptoJS.AES.decrypt(String(cipherText), String(key));
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "";
    }
}

function aesDecryptObject(obj, pass) {
    var out = {};
    if (!obj || typeof obj !== "object") return out;
    for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
            out[k] = aesDecrypt(obj[k], pass);
        }
    }
    return out;
}
