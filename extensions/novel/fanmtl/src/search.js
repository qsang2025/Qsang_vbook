// search.js — Tim kiem theo tu khoa: POST /e/search/index.php.
//
// Form cua site: show=title, tempid=1, tbname=news, keyboard=<tu khoa>.
// Empire CMS tra 302 ve /e/search/result/?searchid=N — app khong tu theo
// redirect cua POST nen doc Location roi fetch tiep (mau shubenshu #44).
// POST nay treo tu VM (timeout 30s, tarpit theo IP datacenter) — kiem
// chung tren may that. Chi tra trang 1 (phan trang ket qua tim kiem cua
// Empire CMS chua kiem chung duoc; tra data2 rong de app khong goi lai
// trang 2 trung du lieu).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var postUrl = BASE_URL + "/e/search/index.php";
    var r = null;
    try {
        r = pacedFetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "show=title&tempid=1&tbname=news&keyboard=" + encodeURIComponent(query),
            timeout: 45000
        });
    } catch (e) {
        return Response.error("Không tải được dữ liệu (lỗi mạng): " + postUrl);
    }
    if (!r) return Response.error("Không tải được dữ liệu: " + postUrl);
    if (r.status === 301 || r.status === 302) {
        var location = "";
        try { location = String(r.res.header("location") || r.res.header("Location") || ""); } catch (e2) {}
        if (!location && r.headers) {
            try { location = String(r.headers["location"] || ""); } catch (e3) {}
        }
        if (!location) return Response.error("Tìm kiếm không trả về trang kết quả (HTTP " + r.status + ")");
        if (location.indexOf("http") !== 0 && location.indexOf("/") !== 0) location = "/e/search/" + location;
        var rr2 = ttlFetchDoc(absUrl(location));
        if (rr2.error) return Response.error(rr2.error);
        return parseSearchResult(rr2.doc);
    }
    if (!r.ok) return Response.error(rateLimitErr("FanMTL", postUrl, r));
    var doc = null;
    try { doc = r.res.html(); } catch (e4) { return Response.error("Không đọc được dữ liệu: " + postUrl); }
    if (!doc) return Response.error("Không đọc được dữ liệu (site trả về rỗng): " + postUrl);
    return parseSearchResult(doc);
}

// Ket qua tim kiem dung cung mau li.novel-item nhu trang danh sach; neu
// mau khac thi fallback sang link /novel/ co title.
function parseSearchResult(doc) {
    var items = parseNovelItems(doc);
    if (items.length > 0) return Response.success(items, "");
    var seen = {};
    var links = doc.select("a[href^=/novel/][title]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        var name = cleanText(a.attr("title"));
        if (!href || !name) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        items.push({ name: name, cover: "", link: link, description: "", host: BASE_URL });
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào");
    return Response.success(items, "");
}
