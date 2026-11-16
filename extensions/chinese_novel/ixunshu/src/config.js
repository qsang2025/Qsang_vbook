// config.js — cau hinh goc cua extension 爱寻书 (ixunshu.net).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. Site khong co mirror nao
// biet duoc nen khong co MIRROR_LIST.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM):
// - Site tra 200 truc tiep cho /xs/<id>, /aggregation/<id>, /xs/<id>/zj/<cid>
//   (khong 301) nen khong can chuan hoa "/" cuoi.
// - Chuong co the chia nhieu trang (?page=N, tieu de h1 ghi (N/M)) —
//   chap.js theo link 下一页 trong .bottem1.
// - Tim kiem GET /zhao/?keyword= — tu VM tra trang 验证码 (captcha cua
//   site); tren may that se kiem chung, neu van bi chan thi bo search.js
//   theo tien le Sách Hay Online / 17k.
// - Khong co anh bia that: #fmimg img luon la /static/default/img/nocover.jpg.
// - Mot so sach cu (vi du 乐可, 2022) bi dao doan van o phia server, khong
//   co co che sap xep lai — xem IXUNSHU-PROGRESS.md §3; da so sach khac
//   doc dung thu tu.
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://ixunshu.net";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Chuan hoa URL ve BASE_URL: doi host khac (www, http) ve BASE_URL,
// giu nguyen duong dan + query (?page=N, ?keyword=...).
function normalizeIxUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    s = s.replace(/^https?:\/\/(www\.)?ixunshu\.net/i, BASE_URL);
    s = s.replace(/^https?:\/\/m\.ixunshu\.net/i, BASE_URL);
    return s;
}

// Fetch 1 trang HTML (UTF-8) co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchIxDoc(url) {
    var r = pacedFetch(url, {});
    if (!r.ok) {
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("ixunshu", pacedHostOf(url), r.cooldownRemainingMs) };
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
