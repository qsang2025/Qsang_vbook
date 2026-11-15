// search.js — Tim kiem theo tu khoa.
//
// Duong chinh: API cua site GET /api/novels/search?query=<q>&count=30
// tra JSON {"items":[{id,name,slug,coverUrl,synopsis}],"result":true}
// (kiem chung tu VM 2026-11-15: "beyond" tra 4 ket qua, co Beyond the
// Zenith; tu khoa khong co ket qua tra items rong). Du phong khi API
// loi hoac tra rong: tim kiem lite GET /novels?q=<q> (cung mau
// td.novel-cell nhu trang duyet). API chi tra toi da 30 ket qua nen
// khong co phan trang (next token luon "").
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function searchViaApi(query) {
    var url = API_URL + "/api/novels/search?query=" + encodeURIComponent(query) + "&count=30";
    var r = null;
    try {
        r = pacedFetch(url, { referer: API_URL + "/" });
    } catch (e) {
        return null;
    }
    if (!r || !r.ok) return null;
    var text = "";
    try {
        text = r.res.text();
    } catch (e2) {
        return null;
    }
    if (!text) return null;
    var data = null;
    try {
        data = JSON.parse(text);
    } catch (e3) {
        return null;
    }
    if (!data || !(data.items instanceof Array)) return null;
    var items = [];
    for (var i = 0; i < data.items.length; i++) {
        var it = data.items[i];
        if (!it || !it.slug || !it.name) continue;
        var cover = it.coverUrl ? absUrl(it.coverUrl) : "";
        items.push({
            name: cleanText(it.name),
            cover: cover,
            link: BASE_URL + "/novel/" + it.slug,
            description: stripTags(it.synopsis || ""),
            host: BASE_URL
        });
    }
    return items;
}

function execute(query, page) {
    query = cleanText(query);
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var items = searchViaApi(query);
    if (items && items.length > 0) return Response.success(items, "");

    // Du phong: tim kiem lite (trang 1, khong phan trang).
    var url = absUrl("/novels?q=" + encodeURIComponent(query));
    var rr = ttlFetchDoc(url);
    if (rr.error) {
        if (items) return Response.error("Không tìm thấy truyện nào với từ khóa: " + query);
        return Response.error(rr.error);
    }
    var liteItems = parseNovelItems(rr.doc);
    if (liteItems.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa: " + query);
    return Response.success(liteItems, "");
}
