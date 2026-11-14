// config.js — cau hinh goc cua extension Sach Hay Online
// (sachhayonline.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// Site: sachhayonline.com — thu vien sach tieng Viet, doc online mien phi,
// khong can dang nhap. Du lieu lay qua scrape HTML (khong co API cong khai):
// danh sach /danh-muc/<slug>?page=N, tac gia /tac-gia/<slug>, chi tiet
// /tua-sach/<slug>, chuong /tua-sach/<slug>/<chuong|hoi>-<so>/<id>.
// Site KHONG co chuc nang tim kiem (moi endpoint tim kiem deu 404, khong
// co form tim kiem) nen extension khong co search.js. Ban tai ePub/mobi/PDF
// khong co link truc tiep trong HTML trang chi tiet nen khong dua vao
// extension — chi lam doc online (xem SACHHAYONLINE-PROGRESS.md §1).
//
// LUU Y: file nay duoc tai len boi cac script khac, nen KHONG duoc tai
// them file nao khac o day. Script nao can pacing thi tu tai file
// rate-limit.js o dau file cua chinh no; script nao can lay phan tu
// dau tien an toan thi tai file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.sachhayonline.com";

try {
    if (DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
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

// BASE_URL khong bao gio nam trong danh sach mirror (tranh thu lap chinh no).
(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// Ghep href tuong doi ("/tua-sach/..." hoac "tua-sach/...") thanh URL
// tuyet doi theo BASE_URL hien tai.
function absUrl(href) {
    href = String(href || "");
    if (!href) return "";
    if (href.indexOf("http://") === 0 || href.indexOf("https://") === 0) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

// Chuan hoa khoang trang: gom khoang trang lien tiep (ke ca nbsp) thanh 1
// khoang, bo khoang trang 2 dau.
function cleanText(text) {
    return String(text === undefined || text === null ? "" : text)
        .replace(/[\s\u00a0\u3000]+/g, " ")
        .replace(/^\s+|\s+$/g, "");
}

// Lay slug truyen tu link dang /tua-sach/<slug> (bo phan sau slug).
function storySlug(link) {
    var m = String(link || "").match(/\/tua-sach\/([^\/\?#]+)/);
    return m ? m[1] : "";
}

// Fetch HTML co pacing (dung pacedFetch cua file rate-limit.js).
// Tra {doc} hoac {error} voi thong bao tieng Viet. 429/405 thi ghi
// cooldown, khong dung browser fallback (cung IP, vo ich — quy tac 11).
// Khong xoay User-Agent: site tra cung mot template cho UA desktop va
// UA mobile (kiem chung live 2026-11-14: trang chu byte-identical cho
// ca 2 UA) nen dung UA mac dinh cua runtime.
function fetchDoc(url) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: BASE_URL + "/" });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Sách Hay Online", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Sách Hay Online", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}
