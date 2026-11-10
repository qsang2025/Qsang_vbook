// search.js — tim kiem truyen tren XTruyen.
// Endpoint tim kiem cua site (WordPress): /?s=<tu khoa>&post_type=wp-manga.
// Trang ket qua dung CUNG giao dien dong .popular-item-wrap nhu trang danh
// sach (site da bo giao dien .c-tabs-item cu): tieu de o .widget-title a,
// bia o .popular-img img, the loai/tac gia o a[rel=tag], chuong moi nhat o
// a.btn-link trong .chapter-item.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

// Lay URL bia that: uu tien data-src (lazy-load), roi src; bo placeholder data:.
// Bia that co the nam tren CDN khac host (thumb.xtruyen.vn) nen KHONG dung
// absUrl (no viet lai host ve BASE_URL) — giu nguyen URL tuyet doi goc.
function coverOf(img) {
    if (!img) return "";
    var src = img.attr("data-src") || img.attr("src") || "";
    if (src.indexOf("data:") === 0) {
        var alt = img.attr("src") || "";
        src = (alt.indexOf("data:") === 0) ? "" : alt;
    }
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    if (src.charAt(0) === "/") return siteOrigin() + src;
    return BASE_URL + "/" + src;
}

// Mo ta dong: the loai + tac gia + chuong moi nhat, noi bang " · ".
function rowDescription(e) {
    var parts = [];
    e.select(".chapter-item a[rel='tag']").forEach(function (a) {
        var t = cleanText(a.text());
        if (t) parts.push(t);
    });
    var latest = e.select(".chapter-item a.btn-link").first();
    if (latest) {
        var lt = cleanText(latest.text());
        if (lt) parts.push(lt);
    }
    return parts.join(" · ");
}

// So trang ke ("") = het. Quet ca ?page=N va /page/N/ trong phan trang.
function nextToken(doc, page) {
    var current = parseInt(page, 10);
    if (isNaN(current) || current < 1) current = 1;
    var last = current;
    doc.select(".pagination a[href]").forEach(function (el) {
        var href = String(el.attr("href") || "");
        var m = href.match(/[?&]page=(\d+)/) || href.match(/\/page\/(\d+)\/?/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (n > last) last = n;
        }
    });
    return last > current ? String(current + 1) : "";
}

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var url = BASE_URL + "/?s=" + encodeURIComponent(query) + "&post_type=wp-manga";
    url = pagedUrl(url, page);

    rateLimitDelay("xtruyen.vn");
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url + "\n\nNếu site đang bắt xác minh Cloudflare, mở trình duyệt trong app vBook vào trang này, xác minh xong rồi thử lại.");

    var items = [];
    var seen = {};
    doc.select(".popular-item-wrap").forEach(function (e) {
        var title = e.select(".widget-title a").first();
        if (!title) title = e.select(".popular-img a").first();
        if (!title) return;
        var link = absUrl(title.attr("href"));
        if (!link || seen[link]) return;
        var text = cleanText(title.text()) || cleanText(title.attr("title"));
        if (!text) return;
        seen[link] = true;
        var cover = e.select(".popular-img img").first();
        items.push({
            name: text,
            link: link,
            cover: coverOf(cover),
            description: rowDescription(e),
            host: siteOrigin()
        });
    });

    return Response.success(items, nextToken(doc, page));
}
