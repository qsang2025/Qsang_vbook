// config.js — cau hinh goc cua extension 小説を読もう！ (yomou.syosetu.com).
//
// BASE_URL la host noi dung (ncode.syosetu.com) — moi URL truyen/chuong
// deu nam o day; yomou.syosetu.com chi la trang doc front-end. API chinh
// thuc cua site (api.syosetu.com/novelapi/api/) dung cho gen/search/
// detail/page; toc/chap doc HTML tinh tu ncode.
// Nguoi dung doi domain trong cai dat (config DOMAIN trong plugin.json)
// thi gia tri do se override qua bien DOMAIN duoc app inject, nam trong
// try/catch. Chi duoc THAM CHIEU DOMAIN trong try/catch, KHONG duoc khai
// bao var trung ten.
//
// Kiem chung live 2026-11-16, tu VM:
// - Ca 3 host (yomou, ncode, api) deu 200, khong Cloudflare, khong
//   challenge, khong can dang nhap de doc chuong.
// - Noi dung chuong nam trong div.p-novel__text (selector #novel_honbun
//   cua base khoa301020 v6 da CHET — 0 lan xuat hien tren trang that).
// - Trang chi tiet co muc luc day du 100 chuong/trang (?p=N); truyen
//   ngan (novel_type 2) khong co muc luc — toan van nam ngay tren trang
//   chi tiet trong div.p-novel__text.
// - Site khong co anh bia (cover.js khong ton tai; detail/list khong
//   co cover — tien le sjks88/powanjuan/qbtr).
// - Chi co co R15 / 残酷な描写あり tren mot so truyen (co bao, khong
//   phai khoa tra phi); noi dung 18+ that nam o domain rieng
//   noc.syosetu.com, ngoai pham vi extension nay.
//
// LUU Y nap file: file nay duoc nap boi cac script khac, nen KHONG duoc
// nap them file nao khac o day. Script nao can helper thi tu nap file
// lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://ncode.syosetu.com";
var YOMOU_URL = "https://yomou.syosetu.com";
var API_URL = "https://api.syosetu.com/novelapi/api/";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Lay N-code (ma truyen) tu URL dang /<ncode>/ hoac /<ncode>/<so>/
// (chu thuong hoa — API tra ncode chu HOA, URL site dung chu thuong).
// Tra "" khi khong phai URL truyen.
function extractNcode(url) {
    // [?] thay cho \? — validator quet chuoi "?" + "." trong regex se bao
    // nham la optional chaining (validate.js lintRhinoES6 khong strip regex).
    var m = String(url === undefined || url === null ? "" : url).match(/\/([nN][a-z0-9]+)(?:\/\d+\/)?\/?(?:[?].*)?$/i);
    if (!m) return "";
    return m[1].toLowerCase();
}

// Chuan hoa URL ve ncode:
// - //ncode.syosetu.com/... -> https://ncode.syosetu.com/...
// - Duong dan tuong doi (/n2529hn/1/) -> tuyet doi tren BASE_URL.
// - yomou.syosetu.com/... -> ncode.syosetu.com/... (cung duong dan).
// - GIU NGUYEN query (?p= cua muc luc) va fragment.
function normalizeSyUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    s = s.replace(/^https?:\/\/yomou\.syosetu\.com/i, BASE_URL);
    return s;
}

// Fetch 1 trang HTML co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchSyDoc(url) {
    var r = null;
    try {
        r = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được trang: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("syosetu", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("syosetu", pacedHostOf(url), r.cooldownRemainingMs) };
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

// Fetch 1 goi API tra JSON; tra ve
// { json: [...] } hoac { error: "tieng Viet" }.
// API tra mang JSON: phan tu [0] la {allcount: N}, cac phan tu sau la
// truyen. Khong can khoa API, khong can dang nhap.
function fetchSyJson(url) {
    var r = null;
    try {
        r = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng)." };
    }
    if (!r) return { error: "Không tải được dữ liệu." };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("syosetu", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("syosetu", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + ")." };
        return { error: "Không tải được dữ liệu (lỗi mạng)." };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu." };
    }
    var json = null;
    try {
        json = JSON.parse(text);
    } catch (e3) {
        return { error: "Không đọc được dữ liệu." };
    }
    if (!json || !(json instanceof Array) || json.length === 0) {
        return { error: "Không đọc được dữ liệu." };
    }
    return { json: json };
}
