// search.js — Tim kiem Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Form tim kiem cua site dung POST /home/search (field "search").
// GET /home/search/<offset>?search=<key> CHI TRA DANH SACH MAC DINH
// (giong nhau moi tu khoa — kiem chung tu VM + may that 2026-11-14),
// nen bat buoc dung POST.
// POST /home/search treo tu VM (timeout 25s, 3 lan — tarpit IP
// datacenter, giong medoctruyenchu) nhung chay tren may that.
// Phan trang theo OFFSET (50 ket qua/trang): POST /home/search/<offset>
// voi cung body. Chay ca co dau va khong dau (kiem chung tren may
// that: "âm dương" va "am duong" deu tra ve Âm Dương Quỷ Đạo).
load("config.js");
load("rate-limit.js");

function parseSearchRow(el, seen) {
    var thumbEl = selFirst(el, "a.thumb");
    if (!thumbEl) return null;
    var href = thumbEl.attr("href") || "";
    if (!href || seen[href]) return null;
    var name = cleanText(thumbEl.attr("title") || "");
    if (!name) {
        var h2 = selFirst(el, "h2.title a");
        if (h2) name = cleanText(h2.text());
    }
    if (!name) return null;
    var imgEl = selFirst(el, "img.img-responsive");
    var cover = imgEl ? normalizeUrl(imgEl.attr("src") || "") : "";
    var authorEl = selFirst(el, "div.chap");
    var author = authorEl ? cleanText(authorEl.text()) : "";
    seen[href] = true;
    return {
        name: name,
        cover: cover,
        link: normalizeUrl(href),
        description: author,
        tag: "",
        host: BASE_URL
    };
}

function execute(key, page) {
    var q = String(key || "").trim();
    if (!q) return Response.error("Nhập từ khóa để tìm truyện.");
    var offset = String(page || "").trim();
    if (offset === "") offset = "0";
    var full = BASE_URL + "/home/search/" + offset;
    var r = thdFetchDoc(full, null, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "search=" + encodeKey(q)
    });
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    doc.select("li.list-group-item-table").forEach(function (el) {
        var item = parseSearchRow(el, seen);
        if (item) items.push(item);
    });
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa \"" + q + "\".");

    var next = "";
    var nextEl = selFirst(doc, "ul.pagination li.active + li a");
    if (nextEl) {
        var href = nextEl.attr("href") || "";
        if (href && href !== "#") {
            var parts = href.split("/");
            var last = parts[parts.length - 1];
            if (/^\d+$/.test(last)) next = last;
        }
    }
    return Response.success(items, next);
}
