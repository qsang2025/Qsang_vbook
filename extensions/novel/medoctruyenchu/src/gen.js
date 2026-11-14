// gen.js — Danh sach truyen Me Doc Truyen Chu (medoctruyenchu.net).
//
// Dung chung cho tab trang chu va the loai (input la duong dan tuong
// doi, vd. "/" hoac "/the-loai/tien-hiep").
// - Trang chu "/": 3 muc SSR — Truyện Hot (.section-stories-hot__list
//   .story-item, 10 truyen co bia), Truyện đã hoàn thành
//   (.section-stories-full__list .story-item-full, 5 truyen), Truyện
//   Mới (.section-stories-new__list .story-item-no-image, 40 truyen,
//   link thang ve /truyen/<slug>) — gop lai, dedupe theo link.
// - Trang the loai: .list-story-in-category .story-item (2-6 truyen
//   tuy the loai — site nho, khong co phan trang).
// Ca 2 dang deu 1 trang duy nhat nen token trang sau luon "".
load("config.js");
load("rate-limit.js");

function parseCard(el) {
    var linkEl = selFirst(el, "a[href*=\"/truyen/\"]");
    if (!linkEl) return null;
    var href = linkEl.attr("href") || "";
    if (!href) return null;
    var nameEl = selFirst(el, ".story-item__name, .story-item-full__name, a.story-name");
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) {
        var img0 = selFirst(el, "img");
        if (img0) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;
    var imgEl = selFirst(el, "img");
    var cover = imgEl ? normalizeUrl(imgEl.attr("src") || "") : "";
    var badges = [];
    el.select(".badge").forEach(function (b) {
        var t = cleanText(b.text());
        if (t) badges.push(t);
    });
    var tag = badges.join(" ");
    var descEl = selFirst(el, ".story-item-no-image__chapters, .story-item-full__badge");
    var description = descEl ? cleanText(descEl.text()) : "";
    return {
        name: name,
        cover: cover,
        link: normalizeUrl(href),
        description: description,
        tag: tag,
        host: BASE_URL
    };
}

function execute(url, page) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link danh sách không hợp lệ.");
    var r = mdcFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var items = [];
    var seen = {};
    var rows = doc.select(".section-stories-hot__list .story-item, .section-stories-full__list .story-item-full, .section-stories-new__list .story-item-no-image, .list-story-in-category .story-item");
    for (var i = 0; i < rows.size(); i++) {
        var item = parseCard(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + full);
    return Response.success(items, "");
}
