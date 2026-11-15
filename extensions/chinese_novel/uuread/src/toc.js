// toc.js — uu看書 (uuread.tw): muc luc day du trong mot trang (#newlist).
// Port tu alexsonxxx v1; them pacing + phat hien trang challenge
// Cloudflare (xem file config.js). Chua thay dau hieu muc luc phan trang
// nen khong co page.js — neu test may thay muc luc bi cat thi bo sung sau.
load('config.js');
load('rate-limit.js');
load('safe-first.js');
load('challenge-handler.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchDoc(url);
    if (!r.ok) return Response.error(httpError(url, r.status, r.challenge, r.cooldownMs));
    var doc = r.doc;

    var chapters = [];
    doc.select("#newlist a").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        chapters.push({
            name: el.text(),
            url: href,
            host: BASE_URL,
            description: "",
            lock: false,
            pay: false
        });
    });

    return Response.success(chapters);
}
