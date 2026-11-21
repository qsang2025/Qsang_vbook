// book.js — danh sach truyen cho mot muc (execute(query, page) -> items).
// Layout da kiem chung cua khotruyenchu.fun (WordPress, SSR):
//   .home-story-card            the truyen
//     a.hs-thumb > img          anh bia (webp 225x300)
//     h3.hs-title > a           ten truyen + link /truyen/<slug>/
//   Phan trang the loai: ?paged=N (vd. /huyen-huyen-tien-hiep/?paged=2);
//   .pagination .page-numbers.current ghi "Trang X / Y". Cac muc
//   /truyen-moi/, /top-qidian/, /yeu-cau-dich/ khong phan trang.
// Tim kiem theo tu khoa KHONG ho tro: /?s=<tu-khoa> 302 ve truyen dau
// tien khop (tien le: aztruyen, sachhayonline) nen book.js bao loi
// tieng Viet ro rang thay vi tra ket qua sai.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function parseList(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select(".home-story-card");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleEl = safeFirst(card.select("h3.hs-title a[href]"));
        if (!titleEl) continue;
        var name = cleanText(titleEl.text());
        var href = String(titleEl.attr("href") || "");
        if (!name || !href) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var cover = "";
        var imgEl = safeFirst(card.select("a.hs-thumb img"));
        if (imgEl) cover = String(imgEl.attr("src") || "");
        items.push({ name: name, link: link, cover: cover, description: "", tag: "", host: siteOrigin() });
    }
    return items;
}

function nextPageToken(doc) {
    var cur = safeFirst(doc.select(".pagination .page-numbers.current"));
    if (!cur) return "";
    var m = cleanText(cur.text()).match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return "";
    var page = parseInt(m[1], 10);
    var total = parseInt(m[2], 10);
    if (isNaN(page) || isNaN(total) || page >= total) return "";
    return String(page + 1);
}

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (query.indexOf("/") !== 0 && query.indexOf("http") !== 0) {
        return Response.error("Kho Truyện Chữ không có trang kết quả tìm kiếm theo từ khóa (web tự chuyển về truyện đầu tiên khớp). Hãy duyệt theo thể loại, Truyện mới hoặc Top Qidian.");
    }
    var url = query.indexOf("http") === 0 ? query : BASE_URL + query;
    url = normalizeUrl(url);
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 1) url += (url.indexOf("?") === -1 ? "?" : "&") + "paged=" + n;
    rateLimitDelay("khotruyenchu.fun", 500, 1500);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang danh sách: " + url);
    var items = parseList(doc);
    if (items.length === 0) {
        return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện): " + url);
    }
    return Response.success(items, nextPageToken(doc));
}
