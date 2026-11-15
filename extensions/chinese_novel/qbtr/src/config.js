// config.js — cau hinh goc cua extension qbtr (qbtr.cc) — PROBE ONLY.
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch: neu app
// khong inject bien do thi BASE_URL mac dinh van dung duoc.
// Site dung GBK (khong phai UTF-8) — fetch o buoc build phai decode
// gb2312/gbk (base Evamirion v1 dung response.html('gb2312')).
// Trang chuong tinh CO noi dung trong div.read_chapterDetail (kiem chung
// tu VM 2026-11-16, 3 sach) — probe chi xac nhan WebView cua app co render
// giong vay khong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.qbtr.cc";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}
