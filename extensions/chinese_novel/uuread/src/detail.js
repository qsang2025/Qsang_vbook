// detail.js — uu看書 (uuread.tw): chi tiet truyen.
// Port tu alexsonxxx v1; sua quirk .first() (xem file safe-first.js:
// first() khong bao gio tra null tren may that) va them pacing +
// phat hien trang challenge Cloudflare (xem file config.js).
load('config.js');
load('rate-limit.js');
load('safe-first.js');
load('challenge-handler.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchDoc(url);
    if (!r.ok) return Response.error(httpError(url, r.status, r.challenge, r.cooldownMs));
    var doc = r.doc;

    var nameEl = safeFirst(doc.select(".info h2"));
    var coverEl = safeFirst(doc.select(".detail-body-body-img img"));
    var intro = safeFirst(doc.select("#bookintro"));
    var info = safeFirst(doc.select(".info"));

    var author = "";
    var category = "";
    doc.select(".info p span").forEach(function (span) {
        var t = span.text().trim();
        if (t.indexOf("作者：") === 0) {
            var a = safeFirst(span.select("a"));
            author = a ? a.text() : t.substring(3);
        } else if (t.indexOf("分類：") === 0) {
            category = t.substring(3);
        }
    });

    // Trang thai: khoi .info co chu "完結" thi da hoan thanh, neu khong thi
    // coi nhu dang ra (uoc luong — chua kiem chung truc tiep tren may).
    var ongoing = true;
    if (info) {
        var infoText = info.text() || "";
        if (infoText.indexOf("完結") !== -1) ongoing = false;
    }

    var tags = [];
    var genres = [];
    var path = sortPath(category);
    if (category && path) {
        tags = [{ title: category, input: path, script: "search.js" }];
        genres = [{ title: "Cùng thể loại", input: path, script: "search.js" }];
    }

    return Response.success({
        name: nameEl ? nameEl.text() : "",
        author: author,
        cover: coverEl ? coverEl.attr("src") : "",
        description: intro ? intro.text() : "",
        detail: info ? info.html() : "",
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        nsfw: false,
        tags: tags,
        genres: genres,
        suggests: [],
        reviews: [],
        comments: []
    });
}
