// chap.js — noi dung chuong.
// Than chuong la <h2>tieu de</h2> + 1 <p> moi doan; moi doan kem 1
// <span class="z"> la so luot binh luan cua doan do — bo di truoc khi tra.
// Chuong doc du, khong can dang nhap (kiem chung live 2026-11-14).
//
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("banshanren.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
    var doc = response.html();

    var box = safeFirst(doc.select(".chapter_content_box"));
    if (box === null) return Response.error("Không tìm thấy nội dung chương");

    var titleEl = safeFirst(box.select("h2"));
    var title = titleEl ? cleanText(titleEl.text()) : "";
    box.select("h2").remove();
    box.select("span.z").remove();
    box.select("script, style").remove();

    var content = box.html();
    if (cleanText(content) === "") return Response.error("Chương trống");

    return Response.success(content, title);
}
