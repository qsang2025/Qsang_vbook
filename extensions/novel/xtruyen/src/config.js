// config.js — cau hinh goc cua extension XTruyen (xtruyen.vn).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN do app inject. Phep override nam trong try/catch: neu app khong
// inject bien do thi BASE_URL mac dinh van dung duoc.
//
// LUU Y: file nay duoc nap boi cac script khac, nen KHONG duoc nap them
// file nao khac o day. Script nao can helper thi tu nap file lib do o dau
// file cua chinh no. Build se copy cac file lib can thiet vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://xtruyen.vn";

try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}
