// config.js — cau hinh goc cua extension 海棠文学 (danmeis.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. MIRRORS (neu co trong
// plugin.json) override sau cung. Ca hai phep override deu nam trong
// try/catch: neu app khong inject bien do thi BASE_URL mac dinh van dung
// duoc. Luu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM
// CHIEU trong try/catch, KHONG duoc khai bao var trung ten.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM):
// - Site dung UTF-8 (khong phai GBK) — giai ma mac dinh duoc.
// - Trang chuong /book/<id>/<n>.html CO SAN noi dung day du trong
//   #TextContent (7.871 ky tu ch.1, 8.987 ky tu ch.2) — fetch tinh duoc,
//   khong can WebView.
// - Trang chi tiet /book/<id>.html CHUA DAY DU muc luc (#chapterList,
//   872 muc sach mau) — khong can page.js.
// - URL danh muc /xuanhuan (khong "/" cuoi) moi dung; dang /xuanhuan/
//   tra 404 — normalizeDmUrl TU BO "/" cuoi cua 6 danh muc.
// - Tim kiem POST /search.html treo tu VM (tarpit IP datacenter) —
//   search.js gui qua WebView cua app.
// - Fetch dung UA mac dinh cua runtime (khong xoay UA — quy tac nha 6.10).
//
// LUU Y ve file lib: file nay duoc cac script khac nap bang lenh load,
// nen KHONG duoc nap them file nao khac o day. Script nao can helper thi
// tu nap file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.danmeis.com";

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
// haitang16.com la alias cua site (redirect ve www.danmeis.com).
var MIRROR_LIST = ["https://www.haitang16.com"];

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

// 6 danh muc chinh cua site (kiem chung live 2026-11-16).
var CATEGORIES = ["xuanhuan", "wuxia", "lishi", "dushi", "kehuan", "qita"];

// Chuan hoa URL ve danmeis.com:
// - //www.danmeis.com/... -> https://www.danmeis.com/...
// - haitang16.com (www/m/bare) -> www.danmeis.com.
// - Duong dan tuong doi (/book/...) -> tuyet doi tren BASE_URL.
// - Danh muc dang /<slug>/ (co "/" cuoi) -> bo "/" cuoi (site tra 404
//   cho dang co "/" cuoi; dang /<slug> khong "/" moi dung).
// - GIU NGUYEN query va fragment.
// - Neu URL da dung host danmeis.com thi tra nguyen (sau khi bo "/" neu can).
function normalizeDmUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    s = s.replace(/^https?:\/\/(www\.|m\.)?haitang16\.com/i, "https://www.danmeis.com");
    s = s.replace(/^https?:\/\/danmeis\.com/i, "https://www.danmeis.com");
    s = s.replace(/^https?:\/\/m\.danmeis\.com/i, "https://www.danmeis.com");
    var m = s.match(/^(https:\/\/www\.danmeis\.com\/(xuanhuan|wuxia|lishi|dushi|kehuan|qita))\/$/);
    if (m) s = m[1];
    return s;
}

// Fetch 1 trang HTML (UTF-8) co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
// Neu domain chinh loi mang/5xx thi thu lan luot cac mirror trong
// MIRROR_LIST (cung pacing).
function fetchDmDoc(url) {
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
            lastError = "Không tải được trang (lỗi mạng).";
            continue;
        }
        if (!r) {
            lastError = "Không tải được trang.";
            continue;
        }
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("danmeis", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("danmeis", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + ").";
            } else {
                lastError = "Không tải được trang (lỗi mạng).";
            }
            continue;
        }
        var doc = null;
        try {
            doc = docFromResponse(r.res, candidates[i]);
        } catch (e2) {
            lastError = "Không đọc được trang.";
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được trang.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || "Không tải được trang." };
}
