// chat_stream.js — chat AI streaming, tuong thich OpenAI (template ai).
// Y tuong: template ai cua Darkrai9x.
// messagesJson: mang message dang JSON; selectedModel: model nguoi dung
// chon (neu khong co thi dung model trong config.js). App rap cac token
// duoc emit thanh cau tra loi day du. Doi endpoint/parse response khi
// nha cung cap dung giao thuc khac (khong phai OpenAI-compatible).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(messagesJson, selectedModel) {
    var messages = JSON.parse(messagesJson);
    var response = fetch(API_BASE_URL + "/chat/completions", {
        method: "POST",
        stream: true,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify({
            model: selectedModel || API_MODEL,
            messages: messages,
            stream: true
        })
    });
    if (!response.ok) return Response.error("Lỗi AI (HTTP " + response.status + ")");

    var line = null;
    while ((line = response.readLine()) !== null) {
        if (line.indexOf("data: ") !== 0) continue;
        var payload = line.substring(6).replace(/^\s+|\s+$/g, "");
        if (!payload || payload === "[DONE]") continue;
        var json = JSON.parse(payload);
        var token = "";
        if (json.choices && json.choices[0] && json.choices[0].delta) {
            token = json.choices[0].delta.content || "";
        }
        if (token) ai.emitToken(token);
    }
    return Response.success("");
}
