// gen.js — Danh sach truyen Truyen Hoang Dung (truyenhoangdung.xyz).
//
// Dung chung cho tab trang chu va the loai (input la duong dan tuong
// doi, vd. "/danh-muc/truyen-dich" hoac "/the-loai/tien-hiep").
// - Moi muc: 25 truyen/trang (bang-xep-hang 100 truyen, khong phan
//   trang), moi muc la mot li.list-group-item-table: ten o a.thumb
//   (title), bia o img.img-responsive (src da ma hoa san), tac gia o
//   div.chap, chuong moi nhat o div.author a.
// - Phan trang theo OFFSET: ul.pagination li.active + li a href dang
//   /<duong-dan>/<offset> (25, 50, ...). Token trang sau la so offset
//   cuoi URL; het trang thi token "".
// - Kiem chung live 2026-11-14: /the-loai/tien-hiep p1 bat dau "Đại Quy
//   Giáp Sư (Dịch)", offset 25 bat dau "Ma Thiên Ký (Bản dịch
//   remake)"; /danh-muc/truyen-dich p1 bat dau "Lười Biếng Ở Đại Đường
//   (Dịch)", offset 25 bat dau "Gian Cấm Đêm Dài (Dịch)".
load("config.js");
load("rate-limit.js");

function parseRow(el) {
    var thumbEl = selFirst(el, "a.thumb");
    if (!thumbEl) return null;
    var href = thumbEl.attr("href") || "";
    if (!href) return null;
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
    var chapEl = selFirst(el, "div.author a");
    var latest = chapEl ? cleanText(chapEl.text()) : "";
    var desc = author;
    if (latest) desc = desc ? desc + " • " + latest : latest;
    return {
        name: name,
        cover: cover,
        link: normalizeUrl(href),
        description: desc,
        tag: "",
        host: BASE_URL
    };
}

function execute(url, page) {
    var base = normalizeUrl(url);
    if (!base) return Response.error("Link danh sách không hợp lệ.");
    var offset = String(page || "").trim();
    var full = base;
    if (offset !== "" && offset !== "0") {
        full = base.replace(/\/+$/, "") + "/" + offset;
    }
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    doc.select("li.list-group-item-table").forEach(function (el) {
        var item = parseRow(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + full);

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
