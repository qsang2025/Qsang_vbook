// detail.js — Thong tin chi tiet mot truyen AkayTruyen (akaytruyen.com).
//
// Trang chi tiet /truyen/<slug> (kiem chung live 2026-11-13):
// - Ten o h3.story-name (du phong h1, roi og:title cat hau to site).
// - Bia o .story-detail__top--image img (du phong og:image).
// - Tac gia / trang thai / the loai o .story-detail__bottom--info:
//   cac <p> dang "Tác giả: <a>...</a>", "Trạng thái: Full/Đang ra",
//   "Thể loại:" + cac link /the-loai/<slug>.
// - Mo ta o .story-detail__top--desc (nhieu <p>, lay nguyen HTML;
//   du phong meta description).
// - So chuong = so chuong lon nhat trong cac link chuong tren trang
//   (trang mac dinh liet ke 50 chuong moi nhat truoc nen max = tong).
// Tra ve { name, author, cover, description, detail, url, type, format,
// ongoing, genres }. execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var storyUrl = normalizeUrl(url).replace(/\/+$/, "");
    if (!storyUrl) return Response.error("Link truyện không hợp lệ.");

    var r = fetchAkDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var nameEl = safeFirst(doc.select("h3.story-name"));
    if (nameEl !== null) name = cleanText(nameEl.text());
    if (!name) {
        var h1 = safeFirst(doc.select("h1"));
        if (h1 !== null) name = cleanText(h1.text());
    }
    if (!name) {
        var og = safeFirst(doc.select("meta[property='og:title']"));
        if (og !== null) name = cleanText(og.attr("content")).replace(/\s*-\s*Akay.*$/i, "");
    }
    if (!name) return Response.error("Không tìm thấy tên truyện.");

    var cover = "";
    var coverEl = safeFirst(doc.select(".story-detail__top--image img"));
    if (coverEl !== null) cover = coverEl.attr("src") || coverEl.attr("data-src") || "";
    if (!cover) {
        var ogImg = safeFirst(doc.select("meta[property='og:image']"));
        if (ogImg !== null) cover = ogImg.attr("content") || "";
    }

    var author = "";
    var statusText = "";
    var genres = [];
    var seenGenre = {};
    var infoRoot = safeFirst(doc.select(".story-detail__bottom--info"));
    if (infoRoot !== null) {
        infoRoot.select("p").forEach(function (p) {
            var t = cleanText(p.text());
            if (t.indexOf("Tác giả:") === 0) {
                var a = safeFirst(p.select("a"));
                author = a !== null ? cleanText(a.text()) : t.replace(/^Tác giả:\s*/, "");
            } else if (t.indexOf("Trạng thái:") === 0) {
                statusText = t.replace(/^Trạng thái:\s*/, "");
            }
        });
        infoRoot.select("a[href*=\"/the-loai/\"]").forEach(function (a) {
            var href = a.attr("href") || "";
            var m = href.match(/\/the-loai\/([a-z0-9-]+)/i);
            if (!m) return;
            var slug = m[1].toLowerCase();
            if (seenGenre[slug]) return;
            var title = cleanText(a.text()).replace(/\s*\(\d+\)\s*$/, "");
            if (!title) return;
            seenGenre[slug] = true;
            genres.push({ title: title, input: BASE_URL + "/the-loai/" + slug, script: "gen.js" });
        });
    }

    var description = "";
    var descEl = safeFirst(doc.select(".story-detail__top--desc"));
    if (descEl !== null) description = descEl.html() || "";
    if (!description) {
        var metaDesc = safeFirst(doc.select("meta[name='description']"));
        if (metaDesc !== null) description = cleanText(metaDesc.attr("content"));
    }

    var maxChapter = 0;
    doc.select("a[href*=\"/chuong-\"], a[href*=\"-chuong-\"]").forEach(function (a) {
        var n = chapterNumberFromUrl(a.attr("href") || "");
        if (n > maxChapter) maxChapter = n;
    });

    var ongoing = true;
    if (statusText) {
        ongoing = statusText.indexOf("Đang ra") !== -1;
    }

    var parts = [];
    if (author) parts.push("Tác giả: " + author);
    if (genres.length > 0) {
        var titles = [];
        var gi = 0;
        for (gi = 0; gi < genres.length; gi++) titles.push(genres[gi].title);
        parts.push("Thể loại: " + titles.join(", "));
    }
    if (statusText) parts.push("Trạng thái: " + statusText);
    if (maxChapter > 0) parts.push("Số chương: " + maxChapter);

    return Response.success({
        name: name,
        author: author,
        cover: cover ? absUrl(cover) : "",
        description: description,
        detail: parts.join("<br>"),
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres
    });
}
