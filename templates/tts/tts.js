// tts.js — tong hop MOT cau thanh audio (template tts).
// Y tuong: template tts cua Darkrai9x.
// Tra ve base64 cua audio (mp3/wav). Gioi han mac dinh cua plugin.json:
// max_length 300 ky tu / 1 cau — doan dai phai tach cau truoc khi goi.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(text, voiceId) {
    var response = fetch(ENGINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, voice: voiceId })
    });
    if (!response.ok) return Response.error("Lỗi TTS (HTTP " + response.status + ")");
    return Response.success(response.base64());
}
