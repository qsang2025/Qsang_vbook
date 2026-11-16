// config.js — cau hinh goc cua extension 腐小说 (fuxsb.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. DOMAIN la bien do app
// inject — chi duoc THAM CHIEU trong try/catch, KHONG duoc khai bao var
// trung ten.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM + probe tren may that):
// - Site dung UTF-8 — doc thang UTF-8, khong can giai ma GBK.
// - Trang chi tiet bi Cloudflare chan theo duong dan + theo UA (desktop
//   UA tra 403, mobile UA tra 200 tu VM); Anh da qua challenge CF 1 lan
//   trong trinh duyet cua app (tien le novels.com.tw) va probe tren may
//   that 2026-11-16 xac nhan fetch cua extension doc duoc trang chi tiet
//   (200, 2.790 ky tu) — nho cookie cf_clearance dung chung. Fetch dung
//   UA mac dinh cua runtime (khong xoay UA — quy tac nha 6.10).
// - URL danh muc khong co "/" cuoi (/chuanyue) se 301 ve dang co "/"
//   (va ve http) — runtime fetch khong theo 301 nen normalizeFxUrl tu
//   them "/" (tien le powanjuan/qbtr).
// - SACH KHONG CO "chuong" rieng: toan bo sach phan trang thanh
//   /<cat>/<id>.html, /<cat>/<id>_2.html, ... /<cat>/<id>_<N>.html;
//   moi trang = 1 muc "chuong" (toc.js sinh 第1章...第N章 tu tong so
//   trang; chap.js doc doan text dai nhat trong .con_box div).
// - Site la BL/耽美 — manifest gan nsfw: true (tien le NiACG/czbooks).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Cac ham fetchFxDoc dung pacedFetch
// (file rate-limit.js), isChallengeDoc / fetchViaBrowser (file
// fetch-helpers.js) — cac file do duoc load sau config.js nhung ham chi
// chay khi execute() goi toi, luc do moi thu da load xong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.fuxsb.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Cac mirror da kiem chung tra 200 tu VM (2026-11-16): www.fuxsb.com,
// www.fuxsb.cc, m.fuxsb.com. Dung lam du phong khi domain chinh loi.
var FX_MIRRORS = ["https://www.fuxsb.com", "https://www.fuxsb.cc", "https://m.fuxsb.com"];

// Chuan hoa URL ve host cua BASE_URL:
// - //www.fuxsb.com/... -> https://www.fuxsb.com/...
// - Duong dan tuong doi (/chuanyue/27772.html) -> tuyet doi tren BASE_URL.
// - Host mirror (m.fuxsb.com, www.fuxsb.cc) -> host cua BASE_URL.
// - Danh muc dang /chuanyue (khong "/" cuoi, khong .html, khong query)
//   se 301 — them "/" truoc khi fetch.
// - GIU NGUYEN query (?searchid=, ?page=) va fragment.
function normalizeFxUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    var host = BASE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    s = s.replace(/^https?:\/\/[^\/]+/i, "https://" + host);
    // Danh muc dang /chuanyue hoac /paihang/zhou (khong "/" cuoi, khong
    // .html, khong query) thi them "/" — site 301 ve dang co "/" neu thieu.
    var m = s.match(/^(https:\/\/[^\/]+\/[a-z]+(?:\/[a-z]+)?)$/);
    if (m) s = m[1] + "/";
    return s;
}

// Fetch 1 trang HTML co pacing; tra ve { doc: Document } hoac
// { error: "tieng Viet" }. Neu domain chinh loi mang/5xx thi thu lan
// luot cac mirror trong FX_MIRRORS (cung pacing). Giai ma UTF-8 thang.
// Trang challenge Cloudflare (HTTP 200 nhung title/body co marker) thi
// thu browser fallback 1 lan; neu browser cung khong qua thi bao loi
// ro rang (mo fuxsb.com trong trinh duyet cua app 1 lan roi thu lai).
// 429/405 -> loi cooldown, KHONG dung browser fallback (cung IP, vo ich
// — quy tac nha 6.11).
function fetchFxDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < FX_MIRRORS.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, FX_MIRRORS[i]);
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
            return { error: rateLimitErrorMessage("fuxsb", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("fuxsb", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
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
            doc = r.res.html();
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (isChallengeDoc(doc)) {
            var bdoc = null;
            try { bdoc = fetchViaBrowser(candidates[i]); } catch (e3) { bdoc = null; }
            if (bdoc && !isChallengeDoc(bdoc)) return { doc: bdoc };
            lastError = "Trang đang yêu cầu xác minh — hãy mở fuxsb.com trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}
