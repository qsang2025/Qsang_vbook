// config.js — cau hinh goc cua extension iqushuwang (iqushuwang.com) — PROBE ONLY.
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject. Phep override nam trong try/catch: neu app
// khong inject bien do thi BASE_URL mac dinh van dung duoc.
// Site dung UTF-8 (kiem chung tu VM: HTML doc thang UTF-8 ra chu Han dung).
// Trang chu tra shell JS challenge "请稍候" (1.937 byte) khi dung UA desktop /
// curl, nhung tra HTML day du (12.605 byte, co link sach /book/<id>/) khi dung
// UA mobile. Probe kiem tra tren may that: fetch tinh cua extension (UA mac
// dinh cua runtime) co doc duoc khong, va WebView co qua duoc thu thach PoW
// (cookie _xsv) khong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.iqushuwang.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}
