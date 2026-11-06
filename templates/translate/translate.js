// translate.js — dich mot doan text (template translate).
// Y tuong: template translate cua Darkrai9x.
// Tra ve chuoi dich don, hoac { translateText, segments } neu can map
// theo tung tu. from mac dinh "auto". Doi URL/body theo API engine that
// (vi du Google Translate, DeepL, LibreTranslate).
// Luu y gioi han cua plugin.json: max_line 50 dong, max_length 5000 ky tu;
// doan dai hon can chia nho truoc khi goi (xem TuanHai03: chunk <= 1700
// ky tu cho Google Translate).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(text, from, to, source) {
    from = from || "auto";
    to = to || "vi";

    var response = fetch(ENGINE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: from, target: to })
    });
    if (!response.ok) return Response.error("Lỗi dịch (HTTP " + response.status + ")");
    return Response.success(response.json().text);
}
