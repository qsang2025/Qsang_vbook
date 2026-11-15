// config.js — cau hinh goc cua extension 8book (8book.com) — PROBE ONLY.
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch: neu app
// khong inject bien do thi BASE_URL mac dinh van dung duoc.
// Site dung UTF-8. Trang chuong tinh chi co chrome (249 ky tu), noi dung
// chuong duoc nap qua JS + iframe share.html (xem probe.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.8book.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}
