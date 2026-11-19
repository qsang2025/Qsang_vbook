// chap.js (video: buoc 1 cua chap -> track) — liet ke server phat duoc
// cua mot tap phim. Input la URL trang xem phim dang
// /-<slug>/tap-<n>-sv<sv>.html. Doc halim_cfg + nonce tu trang xem phim,
// goi player.php lay sources, tra ve 1 muc cho server cua tap do: data la
// link stream truc tiep neu sources co .m3u8/.mp4, nguoc lai la URL trang
// embed trong iframe (track.js se giai tiep). Neu player loi thi tra ve
// chinh URL trang xem phim de track.js thu lai.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang tập phim: " + url);

    var cfg = halimCfg(doc);
    if (!cfg.postId || !cfg.episodeSlug) {
        return Response.success([{ title: "Mặc định", data: url }]);
    }

    var sources = fetchPlayerSources(cfg, url);
    var parsed = parseSources(sources);
    var data = parsed.stream || parsed.embed || url;
    return Response.success([
        { title: "Server " + (cfg.server || "1"), data: data }
    ]);
}
