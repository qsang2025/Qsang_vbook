load('config.js');
load('config-helpers.js');
load('helper.js');

// chap.js (video: buoc 1 cua chuoi chap -> track) — HHKUNGFU.
// Nhan URL tap phim (/watch-<slug>/tap-<N>-sv<S>.html), doc trang xem
// de lay data-post-id / data-ep / data-sv cua tap do (link tap dang
// active) va cac nut server .get-eps ("1080P V1" data-type=tiktik,
// "1080P V2" data-type=pro). Tra ve cac server co san kem server
// du phong "Webview Trang Nguon".
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url, {
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": BASE_URL + "/"
        }
    });
    if (!response.ok) return Response.error("Không tải được trang xem (HTTP " + response.status + ")");
    var doc = response.html();

    // Tim link tap ung voi URL dang xem (uu tien), roi moi den tap active.
    var epLink = null;
    doc.select("a[data-ep]").forEach(function (a) {
        var href = absUrl(a.attr("href"));
        if (href === url || href === url + "/") epLink = a;
    });
    if (epLink === null) {
        var active = doc.select(".halim-episode.active a").first();
        if (active !== null) epLink = active;
    }
    if (epLink === null) return Response.error("Không đọc được thông tin tập phim");

    var postId = epLink.attr("data-post-id");
    var chapter = epLink.attr("data-ep");
    var sv = epLink.attr("data-sv");
    if (!postId || !chapter || !sv) return Response.error("Không đọc được thông tin tập phim");

    var servers = [];
    doc.select("#halim-ajax-list-server .get-eps").forEach(function (el) {
        var type = el.attr("data-type");
        var title = cleanText(el.text());
        if (!type) return;
        servers.push({
            title: title || ("Server " + type),
            data: JSON.stringify({
                type: type,
                postId: postId,
                chapter: chapter,
                sv: sv,
                url: url
            })
        });
    });

    // Neu trang khong render nut server, dung 2 server mac dinh da biet cua site.
    if (servers.length === 0) {
        servers.push({
            title: "1080P V1",
            data: JSON.stringify({ type: "tiktik", postId: postId, chapter: chapter, sv: sv, url: url })
        });
        servers.push({
            title: "1080P V2",
            data: JSON.stringify({ type: "pro", postId: postId, chapter: chapter, sv: sv, url: url })
        });
    }

    // Luon bo sung server du phong: Webview Trang Nguon (xem truc tiep trang web tren app)
    servers.push({
        title: "Webview Trang Nguồn",
        data: JSON.stringify({ type: "web", url: url })
    });

    return Response.success(servers);
}
