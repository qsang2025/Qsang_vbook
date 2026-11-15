// image.js — Cứu Truyện: tải một ảnh chương rồi ráp lại các lát cắt.
// Input là link do chap.js ghép: "<image_url> <JSON lát cắt [sx,sy,sw,sh,
// dx,dy,dw,dh]>". Trả về ảnh đã ráp dưới dạng chuỗi base64 trần (không
// bọc Response, không tiền tố data:) theo hợp đồng chap ảnh của vBook.
// Tương thích Rhino ES6: chỉ dùng var/function, nối chuỗi bằng +.
load('config.js');

function execute(url) {
    var parts = String(url || "").split(" ");
    if (parts.length < 2 || !parts[0]) return null;
    var response = fetch(parts[0], { headers: { "Referer": BASE_URL + "/" } });
    if (!response || !response.ok) return null;
    var imageb64 = response.base64();
    if (!imageb64) return null;
    var image = Graphics.createImage(imageb64);
    if (!image) return null;
    var imgWidth = image.width;
    var imgHeight = image.height;
    var canvas = Graphics.createCanvas(imgWidth, imgHeight);
    var slices = null;
    try {
        slices = JSON.parse(parts[1]);
    } catch (e) {
        return null;
    }
    if (!slices || !Array.isArray(slices) || slices.length === 0) return null;
    for (var i = 0; i < slices.length; i++) {
        var part = slices[i];
        if (!part || !Array.isArray(part) || part.length < 8) continue;
        canvas.drawImage(image, part[0], part[1], part[2], part[3], part[4], part[5], part[6], part[7]);
    }
    return canvas.capture();
}
