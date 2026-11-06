load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
// toc.js — HHKUNGFU (hhkungfu.ee).
// Danh sach tap nam trong cac <div class="halim-server"> tren trang
// chi tiet: nhom #Vietsub (data-sv=1) va #Thuyết Minh (data-sv=2).
// Moi tap la <a data-post-id data-ep="tap-N" data-sv href="/watch-...">
// Site xep tap moi nhat truoc (102 -> 1); tra ve theo thu tu tang dan
// de xem tu tap 1. Nhom Vietsub de ten "Tập N", nhom khac them hau to
// "(Thuyết Minh)" de phan biet.
function execute(url) {
    url = normalizeUrl(url);
    var response = fetchWithFallback(url);
    if (!response.ok) return Response.error("Không tải được danh sách tập (HTTP " + response.status + ")");
    var doc = response.html();

    var groups = doc.select(".halim-server");
    var multi = groups.size() > 1;
    var episodes = [];

    groups.forEach(function (g) {
        var gname = "";
        var nm = g.select(".halim-server-name").first();
        if (nm !== null) gname = cleanText(nm.text()).replace(/^#/, "").replace(/:\s*$/, "");
        var isVietsub = gname.toLowerCase().indexOf("vietsub") !== -1;

        var list = [];
        g.select("a[data-ep]").forEach(function (a) {
            var n = episodeNumber(a.attr("data-ep"));
            var href = a.attr("href");
            if (!href || n === 0) return;
            var title = "Tập " + n;
            if (multi && !isVietsub && gname) title += " (" + gname + ")";
            list.push({ n: n, name: title, url: absUrl(href) });
        });
        list.sort(function (a, b) { return a.n - b.n; });
        list.forEach(function (e) {
            episodes.push({ name: e.name, url: e.url, description: "", lock: false, pay: false });
        });
    });

    if (episodes.length === 0) return Response.error("Chưa có tập nào cho phim này");
    return Response.success(episodes);
}
