// config.js — cau hinh goc cua extension fuxsb (fuxsb.com) — PROBE ONLY.
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch: neu app
// khong inject bien do thi BASE_URL mac dinh van dung duoc.
// Site dung UTF-8 (kiem chung tu VM: HTML doc thang UTF-8 ra chu Han dung).
// Trang chi tiet bi Cloudflare chan theo duong dan + theo UA (desktop UA
// tra 403, mobile UA tra 200 tu VM); Anh da qua challenge CF 1 lan trong
// trinh duyet cua app (tien le novels.com.tw) — probe kiem tra xem cookie
// cf_clearance co duoc fetch cua extension dung chung khong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.fuxsb.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}
