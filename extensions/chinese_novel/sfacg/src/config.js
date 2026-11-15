// config.js — cau hinh goc cua extension SF轻小说 (book.sfacg.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. MIRRORS (neu co trong
// plugin.json) override sau cung. Ca hai phep override deu nam trong
// try/catch: neu app khong inject bien do thi BASE_URL mac dinh van dung
// duoc. Luu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM
// CHIEU trong try/catch, KHONG duoc khai bao var trung ten.
// Ten noi bo dung o day la MIRROR_LIST. Neu app khong inject MIRRORS
// thi dung danh sach mac dinh duoi day (rong: site khong co mirror
// desktop nao biet duoc; m.sfacg.com la ban mobile, khong phai mirror).
//
// Site phan biet User-Agent (kiem chung live 2026-11-16): UA mobile bi
// 302 redirect sang m.sfacg.com — trang chi tiet mobile KHONG co danh
// sach chuong (chi co link chuong moi nhat), chi UA desktop moi nhan
// duoc trang SSR day du (chi tiet + MainIndex + #ChapterBody). Vi vay
// fetchSfDoc LUON gui UA desktop Chrome co dinh cho moi request cua
// extension nay (ngoai le co bang chung theo quy tac nha 6.10;
// tien le tadu/isach — cung tinh huong redirect sang ban mobile).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://book.sfacg.com";

try {
    if (DOMAIN) {
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
    if (MIRRORS) {
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

// UA desktop Chrome co dinh — xem ghi chu o dau file (site redirect
// UA mobile sang m.sfacg.com).
var DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Chuan hoa URL ve desktop book.sfacg.com:
// - m.sfacg.com/b/<id>/ -> https://book.sfacg.com/Novel/<id>/
// - m.sfacg.com/c/<id>/ (chuong mobile) GIU NGUYEN — URL chuong desktop
//   can ca novel id + volume id nen khong suy ra duoc tu /c/<id>/;
//   chap.js co fallback doc ban mobile (.yuedu).
// - bo query/fragment.
function normalizeSfUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    s = s.replace(/[?#].*$/, "");
    var m = s.match(/^https?:\/\/m\.sfacg\.com\/b\/(\d+)\/?$/i);
    if (m) return BASE_URL + "/Novel/" + m[1] + "/";
    return s;
}

// Fetch 1 trang HTML (UTF-8) co pacing + UA desktop; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchSfDoc(url) {
    var r = pacedFetch(url, { headers: { "User-Agent": DESKTOP_UA } });
    if (!r.ok) {
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage(r.cooldownRemainingMs) };
        }
        return { error: "Không tải được trang (HTTP " + (r.status || "?") + ")." };
    }
    var doc = null;
    try {
        doc = docFromResponse(r.res, url);
    } catch (e) {
        return { error: "Không đọc được trang." };
    }
    if (!doc) return { error: "Không đọc được trang." };
    return { doc: doc };
}
