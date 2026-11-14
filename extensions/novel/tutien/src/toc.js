// toc.js — Muc luc cua TruyenCv.
//
// API chinh: GET /story/stories/{id}/chapters/index/ tra JSON
// {version, chapters: [[number, title, ts], ...]} — TOAN BO muc luc
// trong 1 lan goi (da kiem chung: 1.752 va 3.084 chuong). Muc khoa co
// 5 phan tu [number, title, ts, lock_price, lock_until] (lock_until
// tinh bang giay; khoa khi lock_price dat VA lock_until con trong
// tuong lai — giong ham iC() cua frontend).
// Chuong khoa: danh dau [KHÓA] + pay/lock, KHONG mo khoa. Chap.js se
// bao loi tieng Viet khi mo chuong khoa.
//
// Du phong khi index loi: danh sach chuong phan trang
// GET /story/stories/{id}/chapters/?page_size=100&page=N (lap toi khi
// het next, toi da 100 trang).
load("config.js");
load("rate-limit.js");

function isLockedEntry(entry) {
    if (!entry || entry.length <= 3) return false;
    var price = entry[3];
    var until = entry[4];
    if (!price) return false;
    if (!until) return false;
    var untilMs = Number(until) * 1000;
    if (isNaN(untilMs) || untilMs <= 0) return false;
    return untilMs > Date.now();
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    var slug = extractSlug(storyUrl);
    if (!slug) return Response.error("Không xác định được truyện");

    // Buoc 1: lay id truyen tu API chi tiet.
    var r = fetchTT(BASE_URL + "/story/" + encodeURIComponent(slug) + "/", { headers: defaultHeaders() });
    if (!r.ok || !r.res) return Response.error(pacedErrorMessage(r));
    var data = null;
    try { data = r.res.json(); } catch (e) { data = null; }
    if (!data || !data.id) return Response.error("Không tải được thông tin truyện");
    var storyId = data.id;

    // Buoc 2: muc luc qua index (1 lan goi, du chuong).
    var r2 = fetchTT(BASE_URL + "/story/stories/" + storyId + "/chapters/index/", { headers: defaultHeaders() });
    if (r2.ok && r2.res) {
        var idx = null;
        try { idx = r2.res.json(); } catch (e2) { idx = null; }
        if (idx && idx.chapters && idx.chapters.length > 0) {
            var chapters = [];
            var i = 0;
            for (i = 0; i < idx.chapters.length; i++) {
                var entry = idx.chapters[i];
                var num = entry[0];
                var title = (entry[1] || "").trim();
                if (!title) title = "Chương " + num;
                var item = {
                    name: title,
                    url: BASE_URL + "/truyen/" + slug + "/chapter-" + num,
                    host: BASE_URL
                };
                if (isLockedEntry(entry)) {
                    item.name = "[KHÓA] " + item.name;
                    item.lock = true;
                    item.pay = true;
                }
                chapters.push(item);
            }
            if (chapters.length > 0) return Response.success(chapters);
        }
    }

    // Buoc 3 (du phong): danh sach chuong phan trang.
    var chapters2 = [];
    var seenNum = {};
    var page = 1;
    var guard = 0;
    while (guard < 100) {
        guard++;
        var listUrl = BASE_URL + "/story/stories/" + storyId + "/chapters/?page_size=100&page=" + page;
        var r3 = fetchTT(listUrl, { headers: defaultHeaders() });
        if (!r3.ok || !r3.res) break;
        var listData = null;
        try { listData = r3.res.json(); } catch (e3) { listData = null; }
        if (!listData || !listData.results) break;
        var list = listData.results;
        var j = 0;
        for (j = 0; j < list.length; j++) {
            var ch = list[j];
            var num2 = ch.number;
            if (num2 === undefined || num2 === null) continue;
            if (seenNum[num2]) continue;
            seenNum[num2] = true;
            var title2 = (ch.title || "").trim();
            if (!title2) title2 = "Chương " + num2;
            var item2 = {
                name: title2,
                url: BASE_URL + "/truyen/" + slug + "/chapter-" + num2,
                host: BASE_URL
            };
            if (ch.lock_price && ch.lock_until) {
                var untilMs2 = Number(ch.lock_until) * 1000;
                if (!isNaN(untilMs2) && untilMs2 > Date.now()) {
                    item2.name = "[KHÓA] " + item2.name;
                    item2.lock = true;
                    item2.pay = true;
                }
            }
            chapters2.push(item2);
        }
        if (!listData.next) break;
        page++;
    }
    if (chapters2.length > 0) return Response.success(chapters2);

    return Response.error("Không tải được mục lục");
}
