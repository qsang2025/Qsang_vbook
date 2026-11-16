// config.js — cau hinh goc cua extension 爱趣书网 (iqushuwang.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. LUU Y: DOMAIN la bien do
// app inject — chi duoc THAM CHIEU trong try/catch, KHONG duoc khai bao
// var trung ten.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM + probe may that):
// - Site dung UTF-8 (khong phai GBK) — giai ma mac dinh duoc.
// - Trang chu tra shell JS challenge "请稍候" (1.937 byte) khi dung UA
//   desktop / curl, nhung tra HTML day du (12.605 byte, co link sach
//   /book/<id>/) khi dung UA mobile. Fetch tinh cua runtime vBook (UA
//   mac dinh) DOC DUOC tren may that (probe STATIC-HOME SHELL=false,
//   68 link sach) — khong can xoay UA (quy tac nha 6.10).
// - Template mobile: list .article > .block > ul > li (a[href=/book/N/]
//   + span tac gia); chi tiet meta og:novel:* + .info_chapters;
//   chuong div#novelcontent, phan trang _1.html, _2.html...
// - The loai /fenlei/ CHET (404); the loai that o /list/<cat>/<page>.html
//   (cat 0 = tat ca, 1-9 = 9 the loai; 30 sach/trang).
// - Tim kiem POST /search.html (input s) TREO tu VM (tarpit IP
//   datacenter, giong wtr-lab #105) — search.js gui qua WebView cua app.
// - Trang chi tiet KHONG co tom tat that (chi co dong spam "各位书友要是
//   觉得...") — detail.js ghep mo ta tu meta thay vi lay spam.
//
// LUU Y ve file lib: file nay duoc cac script khac nap bang lenh load,
// nen KHONG duoc nap them file nao khac o day. Script nao can helper thi
// tu nap file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.iqushuwang.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Chuan hoa URL ve iqushuwang.com:
// - //www.iqushuwang.com/... -> https://www.iqushuwang.com/...
// - Duong dan tuong doi (/book/...) -> tuyet doi tren BASE_URL.
// - URL chi tiet dang /book/<id> (khong "/" cuoi — app cat "/" cuoi cua
//   URL doi so) -> them "/" cuoi (site dung dang co "/").
// - GIU NGUYEN query va fragment.
function normalizeIqUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    var m = s.match(/^(https?:\/\/[^\/]+\/book\/\d+)$/);
    if (m) s = m[1] + "/";
    return s;
}

// Fetch 1 trang HTML (UTF-8) co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchIqDoc(url) {
    var r = null;
    try {
        r = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng)." };
    }
    if (!r) return { error: "Không tải được trang." };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("iqushuwang", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("iqushuwang", pacedHostOf(url), r.cooldownRemainingMs) };
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
