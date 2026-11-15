// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang truyen /novelnext/<slug>/ (kiem chung live 2026-11-15):
// - Ten: h1; tac gia / the loai / trang thai / chuong moi nhat:
//   meta og:novel:author, og:novel:genre, og:novel:status (OnGoing /
//   Completed), og:novel:lastest_chapter_name.
// - Anh bia: img.lazy data-src /files/image/<slug>.jpg (fallback
//   og:image). Mo ta: div.desc-text (itemprop="description").
// - The loai (chip): link /tag/<slug>/ tren trang (text la slug
//   viet thuong — doi ve Title Case de hien); chip mo danh sach
//   the loai do qua gen.js.
// - ongoing: status chua "Ongoing" (site dung "Ongoing", khong phai
//   "OnGoing" o phan hien thi; meta dung "OnGoing").
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function metaContent(doc, property) {
    var el = safeFirst(doc.select("meta[property=\"" + property + "\"]"));
    if (el === null) return "";
    return el.attr("content") || "";
}

function titleCaseSlug(slug) {
    var parts = String(slug || "").split("-");
    var out = [];
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!p) continue;
        out.push(p.charAt(0).toUpperCase() + p.substring(1));
    }
    return out.join(" ");
}

function execute(url) {
    var detailUrl = absUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    var r = fetchNnDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var h1 = safeFirst(doc.select("h1"));
    var name = h1 === null ? "" : cleanText(h1.text());
    if (!name) name = cleanText(metaContent(doc, "og:novel:novel_name"));
    if (!name) return Response.error("Không tìm thấy tên truyện: " + detailUrl);

    var author = cleanText(metaContent(doc, "og:novel:author"));
    var cover = "";
    var img = safeFirst(doc.select("img.lazy"));
    if (img !== null) cover = img.attr("data-src") || img.attr("src") || "";
    if (!cover) cover = metaContent(doc, "og:image");
    if (cover) cover = absUrl(cover);

    var descEl = safeFirst(doc.select("div.desc-text"));
    var description = descEl === null ? "" : cleanText(descEl.text());

    var status = cleanText(metaContent(doc, "og:novel:status"));
    if (!status) {
        var bodyText = doc.text();
        var idx = bodyText.indexOf("Status:");
        if (idx !== -1) status = cleanText(bodyText.substring(idx + 7, idx + 30));
    }
    var ongoing = status.toLowerCase().indexOf("ongoing") !== -1;

    var lastChapter = cleanText(metaContent(doc, "og:novel:lastest_chapter_name"));
    var detail = "";
    if (status) detail = "Trạng thái: " + status;
    if (lastChapter) detail = detail ? detail + " | Chương mới nhất: " + lastChapter : "Chương mới nhất: " + lastChapter;

    var genres = [];
    var seen = {};
    var tags = doc.select("a[href*=\"/tag/\"]");
    var i = 0;
    for (i = 0; i < tags.size(); i++) {
        var a = tags.get(i);
        var href = a.attr("href");
        if (!href) continue;
        var key = String(href).replace(/\/+$/, "");
        if (seen[key]) continue;
        seen[key] = true;
        var slug = key.substring(key.lastIndexOf("/") + 1);
        genres.push({
            title: titleCaseSlug(slug),
            input: href,
            script: "gen.js"
        });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
