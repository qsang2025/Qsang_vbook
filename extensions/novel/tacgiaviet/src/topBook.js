// topBook.js — Bang xep hang: 1 quan quan + 2 podium + danh sach hang.
// URL dang /bang-xep-hang?period=total&section=works&board=<views|trending|completed>.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var rr = ttlFetchDoc(normalizeUrl(url));
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var data = [];

    var top1 = selFirst(doc, ".ranking-champion-card");
    if (top1) {
        var nameEl = selFirst(top1, ".ranking-champion-copy h2 a");
        var name = nameEl ? cleanText(nameEl.text()) : "";
        var href = nameEl ? nameEl.attr("href") : "";
        if (!href) {
            var coverA = selFirst(top1, "a.ranking-champion-cover");
            if (coverA) href = coverA.attr("href");
        }
        if (href && name) {
            var imgEl = selFirst(top1, "a.ranking-champion-cover img");
            var descEl = selFirst(top1, ".ranking-champion-copy .ranking-story-desc");
            data.push({
                name: "Quán quân: " + name,
                link: normalizeUrl(href),
                cover: imgEl ? normalizeUrl(imgEl.attr("src") || "") : "",
                description: descEl ? cleanText(descEl.text()) : "",
                host: BASE_URL
            });
        }
    }

    var podium = doc.select(".ranking-podium-card");
    for (var i = 0; i < podium.size(); i++) {
        var item = podium.get(i);
        var pNameEl = selFirst(item, ".ranking-podium-copy h3 a");
        var pName = pNameEl ? cleanText(pNameEl.text()) : "";
        var pHref = pNameEl ? pNameEl.attr("href") : "";
        if (!pHref) {
            var pCoverA = selFirst(item, "a.ranking-podium-cover");
            if (pCoverA) pHref = pCoverA.attr("href");
        }
        if (!pHref || !pName) continue;
        var pImgEl = selFirst(item, "a.ranking-podium-cover img");
        data.push({
            name: (i === 0 ? "Á quân: " : "Quý quân: ") + pName,
            link: normalizeUrl(pHref),
            cover: pImgEl ? normalizeUrl(pImgEl.attr("src") || "") : "",
            host: BASE_URL
        });
    }

    var rows = doc.select(".ranking-list-card .ranking-list-row");
    for (var j = 0; j < rows.size(); j++) {
        var row = rows.get(j);
        var rHref = row.attr("href") || "";
        if (!rHref) continue;
        var numEl = selFirst(row, ".ranking-list-number");
        var num = numEl ? cleanText(numEl.text()) : "";
        var rNameEl = selFirst(row, ".ranking-list-copy strong");
        var rName = rNameEl ? cleanText(rNameEl.text()) : "";
        if (!rName) continue;
        var rImgEl = selFirst(row, ".ranking-list-cover img");
        data.push({
            name: (num ? num + ": " : "") + rName,
            link: normalizeUrl(rHref),
            cover: rImgEl ? normalizeUrl(rImgEl.attr("src") || "") : "",
            host: BASE_URL
        });
    }

    if (data.length === 0) return Response.error("Không tìm thấy bảng xếp hạng");
    return Response.success(data);
}
