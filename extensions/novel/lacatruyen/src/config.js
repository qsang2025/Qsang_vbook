// config.js — Cau hinh chung va ham tien ich cho La Ca Truyen (lacatruyen.site)
// QUY TAC: File nay duoc load() vao cac script khac nen TUYET DOI KHONG goi load() o day.
// -> Script nao goi aesEncrypt/aesDecrypt (toc.js, chap.js, page.js) PHAI file crypto.js
//    TRUOC file config.js (load() cua runtime khong de quy nen config.js khong tu load duoc).

var BASE_URL = "https://lacatruyen.site";
var CDN_URL = "https://cms.metruyen.com/storage/uploads/";
var MASTER_KEY = "T5Vv41K5zJBHhtODBnOTdrl3shZVEPqzb16Hzfuh4J5tWrb0";
var USER_TOKEN = "";

// GHI CHU (C3): cac catch rong trong file nay la CO Y — load cau hinh khong bao gio duoc
// fail ca extension (DOMAIN/TOKEN sai, localStorage/localCookie khong co thi chi bo qua
// va dung gia tri mac dinh / token rong). Giu nguyen, khong "sua" thanh bao loi.
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
    }
} catch (e) {
}

function normalizeToken(rawVal) {
    if (!rawVal) return "";
    var s = String(rawVal).trim();
    if (!s) return "";
    s = s.replace(/^Bearer\s+/i, "").trim();
    var m = s.match(/(?:^|;\s*)token=([^;]+)/i);
    if (m && m[1]) {
        return String(m[1]).trim();
    }
    return s.replace(/^token=/i, "").trim();
}

function getActiveToken() {
    if (USER_TOKEN) return USER_TOKEN;
    try {
        if (typeof localConfig !== "undefined" && localConfig && typeof localConfig.getItem === "function") {
            var c1 = localConfig.getItem("TOKEN");
            if (c1) return String(c1).trim();
            var c2 = localConfig.getItem("token");
            if (c2) return String(c2).trim();
        }
    } catch (e) {
    }
    try {
        if (typeof localStorage !== "undefined" && localStorage && typeof localStorage.getItem === "function") {
            var s1 = localStorage.getItem("lacatruyen_token");
            if (s1) return String(s1).trim();
            var s2 = localStorage.getItem("laca_token");
            if (s2) return String(s2).trim();
        }
    } catch (e2) {
    }
    try {
        if (typeof localCookie !== "undefined" && localCookie && typeof localCookie.getCookie === "function") {
            var ck = localCookie.getCookie();
            if (ck) {
                var m = String(ck).match(/(?:^|;\s*)token=([^;]+)/i);
                if (m && m[1]) return String(m[1]).trim();
            }
        }
    } catch (e3) {
    }
    return "";
}

function getSavedToken() {
    return normalizeToken(getActiveToken());
}

function saveToken(t) {
    var clean = normalizeToken(t);
    if (!clean) return;
    try {
        if (typeof localStorage !== "undefined" && localStorage && typeof localStorage.getItem === "function") {
            localStorage.setItem("laca_token", clean);
            localStorage.setItem("lacatruyen_token", clean);
        }
    } catch (e) {
    }
}

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    var s = String(url).trim();
    if (!s) return BASE_URL;
    if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0) {
        // Chi nhan dung 6 TLD khai bao trong plugin.json; neo cuoi host (sau TLD phai la "/"
        // hoac het chuoi) de lacatruyen.site.evil.com / lacatruyen.sitex khong bi rewrite nham.
        s = s.replace(/^https?:\/\/(www\.|m\.)?lacatruyen\.(site|com|live|homes|store|online)(\/|$)/i, BASE_URL + "$3");
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
    var cookieParts = [];
    try {
        if (typeof localCookie !== "undefined" && localCookie && typeof localCookie.getCookie === "function") {
            var hostCookies = String(localCookie.getCookie() || "").trim();
            if (hostCookies) cookieParts.push(hostCookies);
        }
    } catch (e) {
    }

    var rawTk = getActiveToken();
    if (rawTk) {
        var cleanTk = normalizeToken(rawTk);
        if (rawTk.indexOf("=") !== -1 || rawTk.indexOf(";") !== -1) {
            cookieParts.push(rawTk);
            if (cleanTk && rawTk.toLowerCase().indexOf("token=") === -1) {
                cookieParts.push("token=" + cleanTk);
            }
        } else if (cleanTk) {
            cookieParts.push("token=" + cleanTk);
            headers["Authorization"] = "Bearer " + cleanTk;
        }
    }

    if (cookieParts.length > 0) {
        headers["Cookie"] = cookieParts.join("; ");
    }

    if (extraHeaders && typeof extraHeaders === "object") {
        for (var k in extraHeaders) {
            if (typeof extraHeaders[k] !== "undefined" && typeof extraHeaders[k] !== "function") {
                headers[k] = extraHeaders[k];
            }
        }
    }
    return headers;
}

function extractNextData(input) {
    if (!input) return null;
    if (typeof input === "string") {
        var mStr = input.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
        if (mStr && mStr[1]) {
            try {
                return JSON.parse(String(mStr[1]).trim());
            } catch (e0) {
            }
        }
        return null;
    }
    if (typeof input === "object" && typeof input.select === "function") {
        try {
            var el = input.select("script#__NEXT_DATA__").first();
            if (el) {
                var rawText = "";
                try {
                    rawText = String(el.text() || "").trim();
                } catch (e1) {
                }
                if (rawText) {
                    try {
                        return JSON.parse(rawText);
                    } catch (e2) {
                    }
                }
                var rawHtml = "";
                try {
                    rawHtml = String(el.html() || "").trim();
                } catch (e3) {
                }
                if (rawHtml) {
                    try {
                        return JSON.parse(rawHtml);
                    } catch (e4) {
                    }
                }
            }
        } catch (e5) {
        }
        try {
            input = String(input.html() || "");
        } catch (e6) {
            input = "";
        }
    }
    var html = String(input || "");
    var m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (m && m[1]) {
        try {
            return JSON.parse(String(m[1]).trim());
        } catch (e7) {
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
    // List API dung author_pen_name/author_name; pen_name_user/name_user chi la fallback.
    var a = item.author_pen_name || item.author_name || item.pen_name_user || item.name_user || item.story_author || item.author || "";
    a = String(a).trim();
    return a || "Đang cập nhật";
}

function mapStoryItem(raw) {
    if (!raw) return null;
    var item = (raw.story && typeof raw.story === "object") ? raw.story : raw;
    // List API dung title/slug/image; story_title/story_slug/story_image chi co o fallback HTML /category/.
    var name = String(item.title || item.story_title || item.name || "").trim();
    var slug = String(item.slug || item.story_slug || "").trim();
    if (!name || !slug) return null;

    var link = slug.indexOf("http") === 0 ? normalizeUrl(slug) : (BASE_URL + "/story/" + slug.replace(/^\/+/, ""));
    var cover = resolveCover(item.image || item.story_image || raw.image || raw.story_image || "");
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
        if (typeof obj[k] !== "undefined" && typeof obj[k] !== "function") {
            out[k] = aesDecrypt(obj[k], pass);
        }
    }
    return out;
}

// Tripwire MASTER_KEY (N2): mau kiem tra khoa giai ma con dung duoc hay khong.
// KEY_CHECK_CIPHER la ban ma cua chuoi "lacatruyen-key-check-v1" ma hoa bang MASTER_KEY
// hien tai (CryptoJS AES passphrase, salt ngau nhien luc tao — ban ma nay giai dung khoa
// se tra dung chuoi goc; sai khoa thi aesDecrypt tra "" do bat loi Malformed UTF-8).
// Site xoay khoa thi ham nay tra false va toc.js/chap.js bao loi ro rang thay vi tra
// rong lang le. Tao mau moi bang:
//   node -e "var C=require('./src/crypto.js');console.log(C.AES.encrypt('lacatruyen-key-check-v1','<MASTER_KEY moi>').toString())"
// roi kiem tra giai ma nguoc truoc khi thay vao day.
var KEY_CHECK_PLAIN = "lacatruyen-key-check-v1";
var KEY_CHECK_CIPHER = "U2FsdGVkX1/U1d8H/GQAvZr/LFIUuBVqZMkXR0Qwp7F3JC43+jH26OLpMoTUZLBW";

function verifyMasterKey() {
    try {
        return aesDecrypt(KEY_CHECK_CIPHER, MASTER_KEY) === KEY_CHECK_PLAIN;
    } catch (e) {
        return false;
    }
}
