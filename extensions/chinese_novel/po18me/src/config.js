// config.js — cau hinh goc cua extension PO18 (wap.po18me.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. LUU Y: DOMAIN la bien do
// app inject — chi duoc THAM CHIEU trong try/catch, KHONG duoc khai bao
// var trung ten.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM):
// - Site dung UTF-8; khong Cloudflare tu VM; homepage 25.659 byte.
// - The loai that la /wapsort/<n>_1.html (n = 1..8); /wapsort/N_1.html 404.
// - Trang chi tiet KHONG co cover that (chi co /baidu.png) nen detail.js
//   de cover rong; khong dung anh ngau nhien tu ben ngoai.
// - Trang chi tiet khong ghi trang thai dang ra hay da xong nen ongoing mac dinh true.
// - Chuong #nr1 co the chua &nbsp; va <br>; muc luc du 223 chuong tren
//   1 trang /novel/list/<id>/1.html, khong phan trang.
// - Tim kiem POST /s.php (type=articlename, s=<tu khoa>), tra cung bo
//   cuc .common-bookele nhu trang the loai.
//
// LUU Y ve file lib: file nay duoc cac script khac nap bang lenh load,
// nen KHONG duoc nap them file nao khac o day. Script nao can helper thi
// tu nap file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://wap.po18me.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Chuan hoa URL ve po18me.com:
// - //po18me.com/... -> https://po18me.com/...
// - Duong dan tuong doi (/novel/...) -> tuyet doi tren BASE_URL.
// - URL www.po18me.com -> doi host ve BASE_URL (wap).
// - GIU NGUYEN query va fragment.
function normalizeUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        return BASE_URL.replace(/\/+$/, "") + s;
    }
    var m = s.match(/^(https?:\/\/)[^\/]+(\/.*)$/);
    if (m) {
        var host = BASE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
        return m[1] + host + m[2];
    }
    return s;
}

function absUrl(href) {
    var value = String(href === undefined || href === null ? "" : href);
    if (!value) return "";
    if (value.indexOf("//") === 0) return "https:" + value;
    if (value.indexOf("http") === 0) return normalizeUrl(value);
    if (value.charAt(0) === "/") return BASE_URL + value;
    return BASE_URL + "/" + value;
}

function cleanText(value) {
    return String(value === undefined || value === null ? "" : value).replace(/\s+/g, " ").trim();
}

// Fetch 1 trang HTML (UTF-8) co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchPoDoc(url) {
    var r = null;
    try {
        r = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng)." };
    }
    if (!r) return { error: "Không tải được trang." };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("PO18", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("PO18", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + ")." };
        return { error: "Không tải được trang (lỗi mạng)." };
    }
    var doc = null;
    try {
        doc = docFromResponse(r.res, url);
    } catch (e2) {
        return { error: "Không đọc được trang." };
    }
    if (!doc) return { error: "Không đọc được trang." };
    return { doc: doc };
}
