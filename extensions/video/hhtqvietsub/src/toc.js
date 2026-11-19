// toc.js — muc luc cac tap cua mot phim tren hhtq.press.
// Danh sach tap khong co san trong HTML chi tiet: phai doc post_id tu
// halim_cfg, roi POST AJAX halim_episode_pagination cho tung cum
// .eps-page-nav (moi cum 100 tap, data-list-eps la chi so cum,
// data-server la server). Gop cac cum theo thu tu, bo trung theo URL.
// Neu AJAX tra ve rong thi fallback dung mau URL tap lay tu link "Xem
// phim" tren trang chi tiet (/-<slug>/tap-<n>-sv1.html) va khoang tap
// trong data-text ("Tap 1-Tap 94").
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function fallbackChapters(doc, detailUrl) {
    var chapters = [];
    var watch = doc.select("a.watch-movie").first();
    if (watch === null) return chapters;
    var href = String(watch.attr("href") || "");
    var m = href.match(/^(.*\/tap-)(\d+)(-sv\d+\.html.*)$/);
    if (!m) return chapters;
    var nav = doc.select(".eps-page-nav").first();
    var range = nav === null ? "" : String(nav.attr("data-text") || "");
    var rm = range.match(/(\d+)\D+(\d+)\s*$/);
    if (!rm) return chapters;
    var from = parseInt(rm[1], 10);
    var to = parseInt(rm[2], 10);
    if (isNaN(from) || isNaN(to) || to < from || to - from > 2000) return chapters;
    var n = 0;
    for (n = from; n <= to; n++) {
        chapters.push({
            name: "Tập " + n,
            url: absUrl(m[1] + n + m[3]),
            description: "",
            lock: false,
            pay: false
        });
    }
    return chapters;
}

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay(siteOrigin(), 500, 1200);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang phim: " + url);

    var cfg = halimCfg(doc);
    if (!cfg.postId) return Response.error("Không đọc được mã phim trên trang (site có thể đã đổi giao diện): " + url);

    var navs = doc.select(".eps-page-nav");
    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < navs.size(); i++) {
        var nav = navs.get(i);
        var server = String(nav.attr("data-server") || cfg.server || "1");
        var epsNav = String(nav.attr("data-list-eps") || "0");
        var epDoc = fetchEpisodeDoc(cfg.postId, server, epsNav, cfg.episodeSlug, url);
        var eps = parseEpisodes(epDoc);
        var j = 0;
        for (j = 0; j < eps.length; j++) {
            if (seen[eps[j].url]) continue;
            seen[eps[j].url] = true;
            chapters.push({
                name: eps[j].name,
                url: eps[j].url,
                description: "",
                lock: false,
                pay: false
            });
        }
    }

    if (chapters.length === 0) chapters = fallbackChapters(doc, url);
    if (chapters.length === 0) return Response.error("Không đọc được danh sách tập (site có thể đã đổi giao diện): " + url);
    return Response.success(chapters);
}
