// config.js — cau hinh nha cung cap AI (template ai).
// base_url / api_key / model duoc app inject tu config trong plugin.json
// (mode input/select). Chi THAM CHIEU chung trong try/catch, khong khai
// bao var trung ten. Neu app khong inject, dung gia tri mac dinh duoi day.
// Khong ghi API key that vao file mau (xem AGENTS.md muc 7).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var API_BASE_URL = "https://api.openai.com/v1";
var API_KEY = "";
var API_MODEL = "gpt-4o-mini";

try {
    if (base_url) API_BASE_URL = base_url;
} catch (e) {
}

try {
    if (api_key) API_KEY = api_key;
} catch (e) {
}

try {
    if (model) API_MODEL = model;
} catch (e) {
}
