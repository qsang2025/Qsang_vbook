// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server/nguon
// phat duoc cua mot tap phim (template video). Y tuong: template video cua
// Darkrai9x. Moi muc tro thanh mot server cho nguoi dung chon; truong
// data cua muc duoc chon se chuyen sang track.js de giai ra stream that.
// Site chi co 1 server thi tra ve danh sach 1 muc.
// SELECTOR_SERVER_BUTTONS / SELECTOR_SERVER_DATA_ATTR: doi theo site that.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang tập phim: " + url);

    var servers = [];
    doc.select("SELECTOR_SERVER_BUTTONS").forEach(function (el) {
        var data = el.attr("SELECTOR_SERVER_DATA_ATTR");
        if (!data) return;
        servers.push({ title: cleanText(el.text()) || "Server", data: data });
    });

    if (servers.length === 0) {
        servers.push({ title: "Mặc định", data: url });
    }

    return Response.success(servers);
}
