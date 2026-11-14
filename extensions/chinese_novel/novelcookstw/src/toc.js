// toc.js — Muc luc: API /chapter/list/<articleid> tra TOAN BO chuong
// trong 1 lan goi (kiem chung 2026-11-14: 劍來 1279 chuong). Truong isvip
// danh dau chuong VIP (6 truyen mau kiem tra deu 0 chuong VIP) — chuong
// VIP duoc gan co lock/pay va tien to [VIP], chap.js se bao loi ro rang,
// khong mo khoa.
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = normalizeUrl(url);
    var id = parseArticleId(url);
    if (!id) return Response.error("Không đọc được articleid từ URL");

    var r = fetchApi("/chapter/list/" + id);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tải danh sách chương thất bại");

    var list = json.data;
    if (!list || !list.length) return Response.error("Không có dữ liệu chương");

    var result = [];
    for (var i = 0; i < list.length; i++) {
        var c = list[i];
        var isVip = c.isvip === 1 || c.isvip === "1";
        var name = c.chaptername || ("Chương " + (i + 1));
        if (isVip) name = "[VIP] " + name;
        result.push({
            name: name,
            url: makeChapUrl(id, c.chapterid),
            host: BASE_URL,
            lock: isVip,
            pay: isVip
        });
    }
    return Response.success(result);
}
