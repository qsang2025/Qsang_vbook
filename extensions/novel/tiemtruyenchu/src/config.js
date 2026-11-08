// config.js — Cau hinh chung va ham tien ich cho Tiem Truyen Chu
var BASE_URL = "https://tiemtruyenchu.cloud";
var USER_COOKIE = "";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
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

// Bang map ten the loai hien thi -> slug API (theo dung 19 the loai cua genre.js).
// API /api/v1/stories chi nhan slug (cat=huyen-huyen); gui ten hien thi
// lowercase (cat=huyen huyễn) tra ve total 0 (da kiem chung bang curl).
var CATEGORY_SLUGS = {
    "huyền huyễn": "huyen-huyen",
    "tiên hiệp": "tien-hiep",
    "đô thị": "do-thi",
    "khoa huyễn": "khoa-huyen",
    "kiếm hiệp": "kiem-hiep",
    "dị năng": "di-nang",
    "quân sự": "quan-su",
    "lịch sử": "lich-su",
    "võng du": "vong-du",
    "đồng nhân": "dong-nhan",
    "linh dị": "linh-di",
    "điền văn": "dien-van",
    "hiện đại": "hien-dai",
    "cổ đại": "co-dai",
    "ngôn tình": "ngon-tinh",
    "trọng sinh": "trong-sinh",
    "xuyên không": "xuyen-khong",
    "cạnh kỹ": "canh-ky",
    "khác": "khac"
};

function isArray(v) {
    return !!v && Object.prototype.toString.call(v) === "[object Array]";
}

function categorySlug(name) {
    if (!name) return "";
    var key = String(name).trim().toLowerCase();
    if (CATEGORY_SLUGS[key]) return CATEGORY_SLUGS[key];
    return "";
}

// Lay ten hien thi tu gia tri co the la chuoi hoac object (tranh "[object Object]").
function categoryName(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
        return v.name || v.title || v.slug || "";
    }
    return String(v);
}

function normalizeUrl(url) {
    if (!url) return BASE_URL;
    var s = String(url).trim();
    if (s.indexOf("http://") === 0 || s.indexOf("https://") === 0) {
        // Link cu luu duoi ten mien .com (da ngung hoat dong) thi chuyen ve .cloud.
        s = s.replace(/^https?:\/\/(www\.)?tiemtruyenchu\.(com|cloud)/i, BASE_URL);
        return s;
    }
    // Chuoi khong scheme nhung co host (vd. "tiemtruyenchu.cloud/truyen/100").
    if (/^(www\.)?tiemtruyenchu\.(com|cloud)(\/|$)/i.test(s)) {
        return normalizeUrl("https://" + s);
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

// Tach story id tu ca URL dang ID lan URL dang slug (/truyen/<slug>).
// Trang slug chi la interstitial (khong co noi dung) nhung chua deep link
// tiemtruyenchu://truyen/<id> va anh bia /stories/<id>/poster.jpg.
function resolveStoryId(url) {
    var id = extractStoryId(url);
    if (id) return id;
    if (!url) return "";
    var s = String(url).trim();
    if (/\/truyen\/[a-z]/i.test(s)) {
        try {
            var res = fetch(normalizeUrl(s), { headers: buildHeaders() });
            if (res && res.ok) {
                var html = res.text();
                if (html) {
                    var m = html.match(/tiemtruyenchu:\/\/truyen\/(\d+)/i);
                    if (m && m[1]) return m[1];
                    m = html.match(/\/stories\/(\d+)\/poster/i);
                    if (m && m[1]) return m[1];
                }
            }
        } catch (e) {
        }
    }
    return "";
}

function getSavedCookie() {
    if (USER_COOKIE) return USER_COOKIE;
    try {
        if (typeof localCookie !== "undefined" && localCookie && typeof localCookie.getCookie === "function") {
            var lc = localCookie.getCookie();
            if (lc && String(lc).trim()) return String(lc).trim();
        }
    } catch (e) {}
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            var c = localStorage.getItem("ttc_cookie");
            if (c) return String(c).trim();
        }
    } catch (e) {}
    return "";
}

function saveCookie(cookieStr) {
    if (!cookieStr) return;
    try {
        if (typeof localCookie !== "undefined" && localCookie && typeof localCookie.setCookie === "function") {
            localCookie.setCookie(cookieStr);
        }
    } catch (e) {}
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.setItem("ttc_cookie", cookieStr);
        }
    } catch (e) {}
}

function buildHeaders(extraCookie) {
    var headers = {
        "Accept": "application/json, text/html, */*;q=0.8",
        "Referer": BASE_URL + "/"
    };
    var ua = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    try {
        if (typeof UserAgent !== "undefined" && UserAgent && typeof UserAgent.android === "function") {
            ua = UserAgent.android();
        }
    } catch (eUa) {}
    headers["User-Agent"] = ua;
    var ck = extraCookie || getSavedCookie();
    if (ck) {
        headers["Cookie"] = ck;
    }
    return headers;
}

// --- Mobile API (gia lap app Tiem Truyen Chu v1.1.1, ke hoach APK) ---
// Cac truong USERNAME / PASSWORD / ACCESS_TOKEN doc tu Cai dat nguon
// (plugin.json "config"), inject dang global string giong DOMAIN / COOKIE.
// Khong bao gio commit gia tri that (AGENTS.md §7); mac dinh de trong.
// Luu y runtime: khong khai bao bien trung ten key config (USERNAME...),
// chi doc global da inject roi gan sang bien TTC_*.
var TTC_USERNAME = "";
var TTC_PASSWORD = "";
var TTC_ACCESS_TOKEN = "";

try {
    if (typeof USERNAME !== "undefined" && USERNAME) {
        TTC_USERNAME = String(USERNAME).trim();
    }
} catch (e) {
}
try {
    if (typeof PASSWORD !== "undefined" && PASSWORD) {
        TTC_PASSWORD = String(PASSWORD).trim();
    }
} catch (e) {
}
try {
    if (typeof ACCESS_TOKEN !== "undefined" && ACCESS_TOKEN) {
        TTC_ACCESS_TOKEN = String(ACCESS_TOKEN).trim();
    }
} catch (e) {
}

function getAccessToken() {
    if (TTC_ACCESS_TOKEN) return TTC_ACCESS_TOKEN;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            var t = localStorage.getItem("ttc_jwt");
            if (t && String(t).trim()) return String(t).trim();
        }
    } catch (e) {}
    return "";
}

function saveAccessToken(token, refreshToken) {
    if (!token) return;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.setItem("ttc_jwt", String(token));
            if (refreshToken) localStorage.setItem("ttc_refresh", String(refreshToken));
        }
    } catch (e) {}
}

function clearAccessToken() {
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            localStorage.removeItem("ttc_jwt");
            localStorage.removeItem("ttc_refresh");
        }
    } catch (e) {}
}

// Boc tach token JWT tu nhieu dang envelope co the gap:
// {data:{ttc_access_token|access_token|accessToken|token}} hoac flat.
// Ke hoach APK khong ghi mau JSON thanh cong, nen thu tat ca dang pho bien.
function extractToken(json) {
    if (!json || typeof json !== "object") return "";
    var scopes = [];
    if (json.data && typeof json.data === "object") scopes.push(json.data);
    scopes.push(json);
    var keys = ["ttc_access_token", "access_token", "accessToken", "token", "jwt"];
    for (var i = 0; i < scopes.length; i++) {
        for (var k = 0; k < keys.length; k++) {
            var v = scopes[i][keys[k]];
            if (v && typeof v === "string" && v.trim()) return v.trim();
        }
    }
    return "";
}

function extractRefreshToken(json) {
    if (!json || typeof json !== "object") return "";
    var scopes = [];
    if (json.data && typeof json.data === "object") scopes.push(json.data);
    scopes.push(json);
    var keys = ["ttc_refresh_token", "refresh_token", "refreshToken"];
    for (var i = 0; i < scopes.length; i++) {
        for (var k = 0; k < keys.length; k++) {
            var v = scopes[i][keys[k]];
            if (v && typeof v === "string" && v.trim()) return v.trim();
        }
    }
    return "";
}

function parseJsonSafe(res) {
    if (!res) return null;
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

// Dang nhap Mobile API: POST /api/auth/login {username, password}.
// Tra {ok:true, token} khi lay duoc JWT, {ok:false, message} khi that bai.
// Khong throw — chap.js tu quyet dinh fallback.
function loginMobile(username, password) {
    var out = { ok: false, token: "", message: "" };
    if (!username || !password) {
        out.message = "Chưa nhập tài khoản trong Cài đặt nguồn.";
        return out;
    }
    var headers = buildHeaders();
    headers["Content-Type"] = "application/json";
    var res = null;
    try {
        res = fetch(BASE_URL + "/api/auth/login", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ username: username, password: password })
        });
    } catch (e) {
        out.message = "Không kết nối được máy chủ đăng nhập.";
        return out;
    }
    if (!res) {
        out.message = "Không kết nối được máy chủ đăng nhập.";
        return out;
    }
    var json = parseJsonSafe(res);
    if (json && json.message) out.message = String(json.message);
    if (!res.ok) {
        if (!out.message) out.message = "Đăng nhập thất bại (HTTP " + res.status + ").";
        return out;
    }
    var token = extractToken(json);
    if (!token) {
        if (!out.message) out.message = "Máy chủ đăng nhập không trả về token.";
        return out;
    }
    saveAccessToken(token, extractRefreshToken(json));
    out.ok = true;
    out.token = token;
    return out;
}

function buildAuthHeaders(token) {
    var headers = buildHeaders();
    headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = "Bearer " + token;
    return headers;
}

// Goi Mobile API doc chuong: POST /api/v1/chapters/content
// {storyId, chapterNumber} + Authorization Bearer.
// Tra {ok, status, json, message}; json giu nguyen ca khi 401 de doc message.
function fetchMobileChapter(storyId, chapNum, token) {
    var out = { ok: false, status: 0, json: null, message: "" };
    var res = null;
    try {
        res = fetch(BASE_URL + "/api/v1/chapters/content", {
            method: "POST",
            headers: buildAuthHeaders(token),
            body: JSON.stringify({
                storyId: parseInt(storyId, 10),
                chapterNumber: parseInt(chapNum, 10)
            })
        });
    } catch (e) {
        out.message = "Không kết nối được máy chủ đọc chương.";
        return out;
    }
    if (!res) {
        out.message = "Không kết nối được máy chủ đọc chương.";
        return out;
    }
    out.status = res.status || 0;
    out.json = parseJsonSafe(res);
    if (out.json && out.json.message) out.message = String(out.json.message);
    out.ok = !!res.ok;
    if (!out.ok && !out.message) out.message = "Đọc chương thất bại (HTTP " + out.status + ").";
    return out;
}

// Boc tach noi dung + tieu de chuong tu nhieu dang envelope co the gap:
// {data:{content,title}} / {content,title} / {data:{chapter:{content,title}}}...
// Ke hoach APK khong ghi mau JSON thanh cong, nen thu tat ca dang pho bien;
// test tren dien thoai voi token that se xac nhan dang nao server dung.
function extractChapterContent(json) {
    var out = { content: "", title: "" };
    if (!json || typeof json !== "object") return out;
    var scopes = [];
    if (json.data && typeof json.data === "object") scopes.push(json.data);
    if (json.chapter && typeof json.chapter === "object") scopes.push(json.chapter);
    if (json.data && json.data.chapter && typeof json.data.chapter === "object") scopes.push(json.data.chapter);
    scopes.push(json);
    var contentKeys = ["content", "chapter_content", "chapterContent", "text", "body", "content_html", "contentHtml"];
    var titleKeys = ["title", "chapter_title", "chapterTitle", "name"];
    for (var i = 0; i < scopes.length; i++) {
        if (!out.content) {
            for (var c = 0; c < contentKeys.length; c++) {
                var v = scopes[i][contentKeys[c]];
                if (v && typeof v === "string" && v.trim()) { out.content = v; break; }
            }
        }
        if (!out.title) {
            for (var t = 0; t < titleKeys.length; t++) {
                var tv = scopes[i][titleKeys[t]];
                if (tv && typeof tv === "string" && tv.trim()) { out.title = tv.trim(); break; }
            }
        }
        if (out.content && out.title) break;
    }
    return out;
}

function fetchJson(url, extraCookie) {
    var target = normalizeUrl(url);
    var res = null;
    try {
        res = fetch(target, {
            headers: buildHeaders(extraCookie)
        });
    } catch (e) {
        return null;
    }
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

// Go envelope boc data: API hien tra {items, totalPages} o top level,
// nhung van chap nhan ca dang {data: {items, totalPages}} va {data: [...]}.
function unwrapList(json) {
    var out = { items: null, totalPages: 1 };
    if (!json) return out;
    if (isArray(json.items)) {
        out.items = json.items;
        if (json.totalPages) out.totalPages = parseInt(json.totalPages, 10) || 1;
    } else if (json.data) {
        if (isArray(json.data.items)) {
            out.items = json.data.items;
            if (json.data.totalPages) out.totalPages = parseInt(json.data.totalPages, 10) || 1;
            else if (json.totalPages) out.totalPages = parseInt(json.totalPages, 10) || 1;
        } else if (isArray(json.data)) {
            out.items = json.data;
            if (json.totalPages) out.totalPages = parseInt(json.totalPages, 10) || 1;
        }
    }
    return out;
}

// Go envelope chi tiet: API tra {story, chapters, ...} o top level,
// chapters la mang THAT (khong nam trong story). Chap nhan ca dang
// {data: {story, chapters}} va story tran {id, title, chapters}.
function unwrapStory(json) {
    var out = { story: null, chapters: null };
    if (!json) return out;
    if (json.story && json.story.id) {
        out.story = json.story;
        if (isArray(json.chapters) && json.chapters.length) out.chapters = json.chapters;
    } else if (json.data && json.data.id) {
        out.story = json.data;
        if (isArray(json.data.chapters) && json.data.chapters.length) out.chapters = json.data.chapters;
        else if (isArray(json.chapters) && json.chapters.length) out.chapters = json.chapters;
    } else if (json.data && json.data.story && json.data.story.id) {
        out.story = json.data.story;
        if (isArray(json.data.chapters) && json.data.chapters.length) out.chapters = json.data.chapters;
    } else if (json.id && json.title) {
        out.story = json;
        if (isArray(json.chapters) && json.chapters.length) out.chapters = json.chapters;
    }
    return out;
}

// Trang interstitial "tai app" (HTML khi chua dang nhap): khong co noi dung
// that, chi co the <p class="hint">Tải ứng dụng Tiệm Truyện Chữ...</p>.
function isInterstitialDoc(doc) {
    if (!doc) return false;
    try {
        var t = doc.text();
        if (t && (t.indexOf("Tải ứng dụng Tiệm Truyện Chữ") !== -1 || t.indexOf("Đã cài app? Mở trong ứng dụng") !== -1)) {
            return true;
        }
        var og = doc.select("meta[property='og:description']").attr("content");
        if (og && og.indexOf("Tải ứng dụng") !== -1) return true;
    } catch (e) {
    }
    return false;
}

function cleanText(str) {
    if (!str) return "";
    return String(str).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}
