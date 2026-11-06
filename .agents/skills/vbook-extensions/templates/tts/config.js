// config.js — cau hinh engine TTS (template tts).
// ENGINE_URL la endpoint tong hop giong noi mac dinh; neu plugin.json co
// config key ENGINE_URL (mode input) thi app inject va override o day.
// Khong ghi API key that vao file mau (xem AGENTS.md muc 7).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var ENGINE_URL = "https://engine.com/synthesize";

try {
    if (ENGINE_URL_CONFIG) {
        ENGINE_URL = ENGINE_URL_CONFIG;
    }
} catch (e) {
}
