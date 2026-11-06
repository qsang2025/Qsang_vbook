// voice.js — danh sach giong doc cua engine TTS (template tts).
// Y tuong: template tts cua Darkrai9x.
// Moi giong: id (engine dung de goi), name (hien cho nguoi dung chon),
// language theo tag BCP-47 (vi-VN cho giong Viet).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { id: "VOICE_ID_1", name: "Giọng nữ miền Bắc", language: "vi-VN" },
        { id: "VOICE_ID_2", name: "Giọng nam miền Bắc", language: "vi-VN" }
    ]);
}
