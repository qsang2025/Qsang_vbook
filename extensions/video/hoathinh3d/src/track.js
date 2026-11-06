// track.js (video: buoc 2 cua chap -> track) — giai data cua mot server
// (tu chap.js, la link m3u8 truc tiep) thanh stream phat duoc.
// Thu tu uu tien: native (.m3u8/.mp4 truc tiep) -> auto (trang embed,
// de app tu sniff) -> bao loi. Khong dung streamfree.vip.
//
// Load: build se copy config.js vao src/ (chi can BASE_URL).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(data) {
    data = String(data || "");

    // Da la stream truc tiep.
    if (data.indexOf(".m3u8") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: BASE_URL,
            mimeType: "application/x-mpegURL",
            headers: { "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }
    if (data.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: BASE_URL,
            mimeType: "video/mp4",
            headers: { "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    // Trang embed (vd. player.phimapi.com): de app tu sniff stream.
    if (data.indexOf("http") === 0) {
        return Response.success({
            type: "auto",
            data: data,
            host: BASE_URL,
            headers: { "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    return Response.error("Không giải được link phát từ dữ liệu server.");
}
