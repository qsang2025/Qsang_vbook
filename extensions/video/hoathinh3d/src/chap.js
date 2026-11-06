// chap.js (video: buoc 1 cua chap -> track) — liet ke cac server phat
// duoc cua mot tap phim. Input la URL muc luc dang
// /phim/<slug>?ep=<slug-tap>; tim tap do trong moi server cua API
// /phim/<slug> va tra ve 1 muc cho moi server co tap nay, data la link
// m3u8 truc tiep (khong dung streamfree.vip hay bat ky embed nao).
//
// Load: build se copy config.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('helper.js');

function execute(url) {
    var slug = slugFromDetailUrl(url);
    var epSlug = episodeSlugFromUrl(url);
    if (!slug || !epSlug) return Response.error("Không xác định được tập phim từ URL: " + url);

    var json = fetchJson(BASE_URL + "/phim/" + slug);
    if (!json || !json.episodes) return Response.error("Không tải được thông tin tập phim: " + url);

    var tracks = [];
    var s = 0;
    for (s = 0; s < json.episodes.length; s++) {
        var server = json.episodes[s];
        var data = server.server_data || [];
        var j = 0;
        for (j = 0; j < data.length; j++) {
            if (data[j].slug !== epSlug) continue;
            var m3u8 = data[j].link_m3u8 || "";
            if (!m3u8) continue;
            tracks.push({ title: server.server_name || ("Server " + (s + 1)), data: m3u8 });
            break;
        }
    }

    if (tracks.length === 0) return Response.error("Tập phim chưa có link phát: " + url);
    return Response.success(tracks);
}
