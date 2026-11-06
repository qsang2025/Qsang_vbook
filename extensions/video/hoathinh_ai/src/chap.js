// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server/nguon
// phat duoc cua mot video Dailymotion.
// Dailymotion chi co 1 nguon phat duy nhat -> tra ve danh sach 1 muc,
// data la video id (chuoi mo, track.js se giai ra link .m3u8).
//
// Load: build se copy config.js, config-helpers.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var id = videoIdFromUrl(url);
    if (!id) return Response.error("Không đọc được id video từ URL: " + url);

    return Response.success([
        { title: "Dailymotion", data: id }
    ]);
}
