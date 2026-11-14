// detail.js — Thong tin truyen Me Doc Truyen Chu (medoctruyenchu.net).
//
// - Ten: h3.story-name. Bia: og:image (fallback .book-3d img).
// - Tac gia: meta article:author (fallback dong "Tác giả:" trong mo ta).
// - Mo ta: .story-detail__top--desc (gom ca dong "Tác giả:" / "Thể loại:"
//   / "Edit:" o dau + phan "Giới thiệu").
// - Trang thai: <p><strong>Trạng thái:</strong> <span> ("Full" /
//   "Đang ra") — ongoing = khac "Full".
// - The loai: tach dong "Thể loại:" trong mo ta theo dau phay, chi giu
//   tag nao khop 1 trong 19 the loai cua site (vd. "Cổ đại" khop co-dai;
//   tag kieu "linh dị thần quái", "HE" khong phai the loai nen bo).
// - Goi y: top truyen trong ngay o sidebar #top-day .rating-item.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link truyện không hợp lệ.");
    var r = mdcFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var titleEl = selFirst(doc, "h3.story-name");
    if (!titleEl) return Response.error("Không tìm thấy truyện");
    var name = cleanText(titleEl.text());
    if (!name) return Response.error("Không tìm thấy truyện");

    var cover = "";
    var og = selFirst(doc, "meta[property=\"og:image\"]");
    if (og) cover = og.attr("content") || "";
    if (!cover) {
        var coverEl = selFirst(doc, ".book-3d img");
        if (coverEl) cover = coverEl.attr("src") || "";
    }

    var author = "";
    var authorMeta = selFirst(doc, "meta[property=\"article:author\"]");
    if (authorMeta) author = authorMeta.attr("content") || "";

    var descEl = selFirst(doc, ".story-detail__top--desc");
    var description = descEl ? descEl.html() : "";
    var descText = descEl ? cleanText(descEl.text()) : "";
    if (!author) {
        var am = descText.match(/Tác giả:\s*([^ ][^<]*?)(?:Thể loại:|$)/);
        if (am) author = cleanText(am[1]);
    }

    var status = "";
    doc.select("p.mb-1").forEach(function (el) {
        var t = cleanText(el.text());
        if (t.indexOf("Trạng thái:") === 0) {
            status = t.replace("Trạng thái:", "").trim();
        }
    });

    var details = [];
    if (author) details.push("Tác giả: " + author);
    var tm = descText.match(/Thể loại:\s*(.+?)(?:Edit:|Giới thiệu|$)/);
    var tagLine = tm ? cleanText(tm[1]) : "";
    if (tagLine) details.push("Thể loại: " + tagLine);
    if (status) details.push("Trạng thái: " + status);

    var genres = [];
    if (tagLine) {
        var tags = tagLine.split(",");
        for (var i = 0; i < tags.length; i++) {
            var g = findGenreByName(cleanText(tags[i]));
            if (g) {
                genres.push({ title: g.title, input: "/the-loai/" + g.slug, script: "gen.js" });
            }
        }
    }

    var suggests = [];
    var seenSug = {};
    doc.select("#top-day .rating-item a[href*=\"/truyen/\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        var t = cleanText(el.text());
        if (!href || !t || seenSug[href]) return;
        seenSug[href] = true;
        suggests.push({ title: t, input: normalizeUrl(href), script: "detail.js" });
    });

    return Response.success({
        name: name,
        author: author,
        cover: normalizeUrl(cover),
        description: description,
        detail: details.join("<br>"),
        url: full,
        type: "novel",
        format: "novel",
        ongoing: status !== "Full",
        genres: genres,
        suggests: suggests
    });
}
