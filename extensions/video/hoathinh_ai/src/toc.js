// toc.js — muc luc cua mot video Dailymotion.
// Video Dailymotion la video don le, khong co nhieu tap -> muc luc chi co
// 1 muc "Xem video" tro ve chinh URL xem video do. Lay ten video qua API
// chi tiet de dat ten muc (fallback "Xem video" neu API loi).
// Khong co page.js (muc luc khong phan trang).
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

    var name = "Xem video";
    var v = dmApiGet(API_BASE + "/video/" + id + "?fields=id,title");
    if (v && v.title) name = cleanText(v.title);

    return Response.success([{
        name: name,
        url: watchUrl(id),
        description: "",
        lock: false,
        pay: false
    }]);
}
