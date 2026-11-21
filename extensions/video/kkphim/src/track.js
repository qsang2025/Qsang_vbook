// track.js (video: buoc 2 cua chap -> track) — giai data cua mot server
// (tu chap.js, la link m3u8 truc tiep) thanh stream phat duoc.
// Chi tra type native cho .m3u8/.mp4 truc tiep; KHONG bao gio tra type
// "auto" (app khong sniff duoc stream JS, nguoi dung se thay loi
// "Khong the tai may chu nay"). Du lieu khong phai stream truc tiep
// thi bao loi ro rang bang tieng Viet.
// host lay tu origin cua chinh URL stream that (vd. https://s6.kkphimplayer6.com),
// khong phai domain API phimapi.com — stream nam tren CDN khac; Referer
// van la domain nguon BASE_URL + "/".
// Link m3u8 duoc giai moi luc bam Play (chap.js chi goi data), vi link
// CDN co the het han sau ~1 gio — khong hardcode link trong code.
//
// Tai len: file config.js (chi can BASE_URL).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

// Origin cua URL (vd. "https://s6.kkphimplayer6.com") — dung lam host de app
// gan cookie/Referer theo dung host phat stream. Fallback ve BASE_URL
// neu khong tach duoc origin.
function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : BASE_URL;
}

function execute(data) {
    data = String(data || "");
    var host = originOf(data);

    // Da la stream truc tiep.
    if (data.indexOf(".m3u8") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: host,
            mimeType: "application/x-mpegURL",
            headers: { "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }
    if (data.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: data,
            host: host,
            mimeType: "video/mp4",
            headers: { "Referer": BASE_URL + "/" },
            timeSkip: []
        });
    }

    return Response.error("Không giải được link phát từ dữ liệu server.");
}
