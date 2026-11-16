// config.js — cau hinh goc cua extension Gia Toc Vuong Tai
// (giatocvuongtai.com). TAM THOI cho probe #111.
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. Luu y: DOMAIN la bien do
// app inject — chi duoc THAM CHIEU trong try/catch, KHONG duoc khai bao
// var trung ten.
//
// DAC BIET (kiem chung tu VM 2026-11-16):
// - Homepage tra 200 day du HTML (Astro SSR, ~140 KB) ca UA mobile lan
//   desktop; card truyen: article a[href^='/stories/'] + img cover
//   (covers.giatocvuongtai.com / avatars.giatocvuongtai.com) + h3 a ten
//   + p span tac gia + span dich gia.
// - /stories/all/ va /stories/<slug>/ tra 403 "Just a moment..."
//   (Cloudflare challenge) tu VM ca hai UA. Anh DA qua CF 1 lan trong
//   trinh duyet cua app vBook (2026-11-16 16:37) nen cookie cf_clearance
//   nam trong kho cookie cua app tren may — probe nay kiem tra fetch
//   tinh tren may co qua nho cookie do khong.
// - /api/public/settings tra 200 JSON tu VM (khong bi CF chan); cac
//   duong /api/public/stories tra 404 — chua biet route API that.
// - Fetch dung UA mac dinh cua runtime (khong xoay UA — quy tac nha
//   6.10: Cloudflare gan cookie voi UA cua trinh duyet da qua xac minh).
//
// LUU Y ve file lib: file nay duoc cac script khac nap bang lenh load,
// nen KHONG duoc nap them file nao khac o day. Script nao can helper thi
// tu nap file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://giatocvuongtai.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Chuan hoa URL ve giatocvuongtai.com:
// - //giatocvuongtai.com/... -> https://giatocvuongtai.com/...
// - www.giatocvuongtai.com -> giatocvuongtai.com.
// - Duong dan tuong doi (/stories/...) -> tuyet doi tren BASE_URL.
// - GIU NGUYEN query va fragment.
function normalizeGtUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    s = s.replace(/^https?:\/\/www\.giatocvuongtai\.com/i, "https://giatocvuongtai.com");
    return s;
}
