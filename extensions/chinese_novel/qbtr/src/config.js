// config.js — cau hinh goc cua extension 全本同人小说 (qbtr.cc).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. MIRRORS (neu co trong
// plugin.json) override sau cung. Ca hai phep override deu nam trong
// try/catch: neu app khong inject bien do thi BASE_URL mac dinh van dung
// duoc. Luu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM
// CHIEU trong try/catch, KHONG duoc khai bao var trung ten.
// Ten noi bo dung o day la MIRROR_LIST. Site khong co mirror nao biet
// duoc nen danh sach mac dinh rong.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM + probe tren may that):
// - Site dung GBK — moi trang phai giai ma bang response.html('gbk')
//   (file gbk.js), doc dung UTF-8 se ra chu rac.
// - Trang chuong tinh CO noi dung day du trong div.read_chapterDetail
//   (rescan #12 ghi teaser 88 ky tu la SAI) — chap.js fetch tinh duoc,
//   khong can WebView. Probe Engine chi xac nhan them WebView cung doc
//   duoc (ch.1 1.493 ky tu tren may that).
// - URL danh muc khong co "/" cuoi se 301 ve dang co "/" (va ve http)
//   — runtime fetch khong theo 301 nen normalizeQbUrl tu them "/".
// - Fetch dung UA mac dinh cua runtime (khong xoay UA — quy tac nha 6.10).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.qbtr.cc";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Tach chuoi mirror cach nhau bang dau phay (hoac mang co san) thanh mang
// cac base URL sach (bo khoang trang va dau "/" cuoi).
function parseMirrorList(value) {
    var list = [];
    var parts = [];
    var i = 0;
    if (typeof value === "string") {
        parts = value.split(",");
        for (i = 0; i < parts.length; i++) {
            var u = parts[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (u) list.push(u);
        }
        return list;
    }
    if (value instanceof Array) {
        for (i = 0; i < value.length; i++) {
            var v = String(value[i]).replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (v) list.push(v);
        }
        return list;
    }
    return list;
}

// Danh sach mirror mac dinh (khop voi config MIRRORS trong plugin.json).
var MIRROR_LIST = [];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

// BASE_URL khong bao gio nam trong danh sach mirror (tranh thu lap chinh no).
(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// Chuan hoa URL ve qbtr.cc:
// - //www.qbtr.cc/... -> https://www.qbtr.cc/...
// - Duong dan tuong doi (/tongren/...) -> tuyet doi tren BASE_URL.
// - Danh muc khong co "/" cuoi (/tongren, /changgui, /hot, /author)
//   se 301 ve dang co "/" — them "/" truoc khi fetch.
// - GIU NGUYEN query (?tagid=, ?page=, ?searchid=) va fragment.
// - Neu URL da dung host qbtr.cc thi tra nguyen (sau khi them "/" neu can).
function normalizeQbUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    s = s.replace(/^https?:\/\/qbtr\.cc/i, "https://www.qbtr.cc");
    // Danh muc dang /tongren (khong "/" cuoi, khong .html, khong query)
    // thi them "/" — site 301 ve dang co "/" (va ve http) neu thieu.
    var m = s.match(/^(https:\/\/www\.qbtr\.cc\/(tongren|changgui|hot|author))$/);
    if (m) s = m[1] + "/";
    return s;
}

// Fetch 1 trang HTML co pacing + giai ma GBK; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
// Neu domain chinh loi mang/5xx thi thu lan luot cac mirror trong
// MIRROR_LIST (cung pacing). Giai ma bang htmlGbk() (file gbk.js) —
// doc dung UTF-8 (docFromResponse) se ra chu rac tren site GBK nay.
function fetchQbDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var r = null;
        try {
            r = pacedFetch(candidates[i], {});
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        if (!r) {
            lastError = "Không tải được trang: " + url;
            continue;
        }
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("qbtr", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("qbtr", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
                continue;
            }
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        var doc = null;
        try {
            doc = htmlGbk(r.res);
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (isChallengeDoc(doc)) {
            lastError = "Trang đang yêu cầu xác minh — hãy mở qbtr.cc trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}
