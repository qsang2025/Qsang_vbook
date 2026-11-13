// toc.js — Muc luc: GET /api/reading/<slug>/chapters.
// API tra TOAN BO chuong trong 1 goi (Đế Bá 4.941 chuong, Linh Vũ Thiên
// Hạ 4.703 chuong — kiem chung 2026-11-13) nen KHONG can page.js.
// Chuong co coins > 0 va isBought false la chuong tra phi: danh dau pay
// + lock, ten them tien to "[VIP] " (tien le theo 17k #21). Chuong mien
// phi ten "Chương <num>: <ten>".
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var slug = slugOf(url);
    if (!slug) return Response.error("Không xác định được truyện từ đường dẫn.");

    var r = fetchTvApi("/api/reading/" + encodeURIComponent(slug) + "/chapters");
    if (r.error) return Response.error(r.error);

    var json = r.json || {};
    var docs = json.docs || [];
    var list = [];
    for (var i = 0; i < docs.length; i++) {
        var chap = docs[i];
        if (!chap || chap.num === undefined || chap.num === null) continue;
        var coins = parseInt(chap.coins, 10);
        if (isNaN(coins)) coins = 0;
        var buy = coins > 0 && chap.isBought !== true;
        var name = "Chương " + chap.num + ": " + (chap.name || "");
        if (buy) name = "[VIP] " + name;
        list.push({
            name: name,
            url: url + "/chuong-" + chap.num,
            lock: buy,
            pay: buy,
            host: BASE_URL
        });
    }
    if (list.length === 0) return Response.error("Không tải được danh sách chương.");
    return Response.success(list);
}
