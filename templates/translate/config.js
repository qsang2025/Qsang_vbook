// config.js — cau hinh engine dich (template translate).
// ENGINE_URL la endpoint dich mac dinh; neu plugin.json co config key
// ENGINE_URL (mode input) thi app inject va override o day (try/catch).
// Khong ghi API key that vao file mau (xem AGENTS.md muc 7).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var ENGINE_URL = "https://engine.com/translate";

try {
    if (ENGINE_URL_CONFIG) {
        ENGINE_URL = ENGINE_URL_CONFIG;
    }
} catch (e) {
}
