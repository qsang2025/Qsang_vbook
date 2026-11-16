// config.js — cau hinh goc cua extension shenyebook (shenyebook.com) — PROBE ONLY.
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch: neu app
// khong inject bien do thi BASE_URL mac dinh van dung duoc.
// Site dung UTF-8. Trang chu tra shell GDPR/CMP cua consentmanager.net
// (~27 KB, khong co link sach, redirect 302 ve ww17.shenyebook.com) voi ca
// UA desktop lan UA mobile tu VM — noi dung that khong co trong HTML tinh.
// Probe kiem tra tren may that: fetch tinh cua extension co doc duoc khong,
// va WebView co vuot qua duoc lop CMP (banner dong y) de hien noi dung that
// (danh sach sach, chi tiet, chuong) khong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://shenyebook.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}
