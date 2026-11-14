// search.js — Tim kiem theo tu khoa: POST /search (JSON).
//
// Tim kiem cua site la AJAX (giai ma tu assets/dist/app.js):
// POST /search, Content-Type application/json, body
// {"query": <tu khoa>, "_token": <data-csrf>}. Token lay tu thuoc
// tinh data-csrf cua input.input-search tren trang chu (1 GET truoc,
// co pacing). Tra JSON {result: [{slug, name, image}]} — link truyen
// la /novel/<slug>, bia la image (duong dan tuong doi).
// Khong phan trang (ket qua la dropdown goi y) — data2 luon "".
//
// CANH BAO: POST /search treo tu VM (000, timeout 25s) — chua kiem
// chung duoc tu VM; chi co the xac nhan tren may that. Neu may that
// cung loi thi bo search.js theo tien le aztruyen/17k.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    // Buoc 1: lay CSRF token tu trang chu.
    var home = ttlFetchDoc(BASE_URL + "/");
    if (home.error) return Response.error(home.error);
    var input = selFirst(home.doc, "input.input-search");
    var token = input ? (input.attr("data-csrf") || "") : "";
    if (!token) return Response.error("Không lấy được mã tìm kiếm của site, thử lại sau");

    // Buoc 2: POST /search dang JSON.
    var body = JSON.stringify({ query: query, _token: token });
    var r = null;
    try {
        r = pacedFetch(BASE_URL + "/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
            referer: BASE_URL + "/"
        });
    } catch (e) {
        return Response.error("Không tải được kết quả tìm kiếm (lỗi mạng)");
    }
    if (!r) return Response.error("Không tải được kết quả tìm kiếm");
    if (!r.ok) return Response.error(rateLimitErr("ReaderNovel", BASE_URL + "/search", r));
    var data = null;
    try {
        data = r.res.json();
    } catch (e2) {
        return Response.error("Không đọc được kết quả tìm kiếm");
    }
    var results = (data && data.result) ? data.result : [];
    var items = [];
    for (var i = 0; i < results.length; i++) {
        var it = results[i];
        var slug = it.slug || "";
        var name = cleanText(it.name) || "";
        if (!slug || !name) continue;
        var cover = it.image || it.poster || "";
        if (cover) cover = absUrl(cover);
        items.push({
            name: name,
            cover: cover,
            link: BASE_URL + "/novel/" + slug,
            host: BASE_URL
        });
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa: " + query);
    return Response.success(items, "");
}
