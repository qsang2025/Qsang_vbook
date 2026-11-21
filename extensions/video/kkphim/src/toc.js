// toc.js — muc luc cac tap cua mot phim tu API /phim/<slug>.
// Phim co nhieu server (Vietsub + Thuyet Minh) thi gop cac tap trung
// slug lai thanh 1 muc (chap.js se tra ca 2 server cho tap do de nguoi
// dung chon). URL muc = URL chi tiet + "?ep=<slug-tap>" de chap.js
// biet tap nao. description ghi ten server khi co nhieu server.
//
// Tai len: file config.js, file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var slug = slugFromDetailUrl(url);
    if (!slug) return Response.error("Không đọc được slug phim từ URL: " + url);

    var json = fetchJson(BASE_URL + "/phim/" + slug);
    var d = detailData(json);
    if (!d || !d.episodes) return Response.error("Không tải được mục lục: " + url);

    var detailUrl = BASE_URL + "/phim/" + slug;
    var multiServer = d.episodes.length > 1;
    var chapters = [];
    var seen = {};
    var s = 0;
    for (s = 0; s < d.episodes.length; s++) {
        var server = d.episodes[s];
        var data = server.server_data || [];
        var j = 0;
        for (j = 0; j < data.length; j++) {
            var ep = data[j];
            if (!ep || !ep.slug) continue;
            if (seen[ep.slug]) continue;
            seen[ep.slug] = true;
            chapters.push({
                name: ep.name || ep.slug,
                url: detailUrl + "?ep=" + ep.slug,
                description: multiServer ? (server.server_name || "") : "",
                lock: false,
                pay: false
            });
        }
    }

    if (chapters.length === 0) return Response.error("Phim chưa có tập nào: " + url);
    return Response.success(chapters);
}
