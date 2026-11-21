// chap.js (video: buoc 1 cua chap -> track) — liet ke server phat cua
// mot tap phim tren HH3D (hh3d.ad).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    return Response.success([
        { title: "Server 1 (HLS)", data: url },
        { title: "Webview Trang Nguồn", data: JSON.stringify({ type: "web", url: url }) }
    ]);
}
