// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
//
// Layout da kiem chung cua trang chi tiet docln.sbs:
//   .series-name a                       ten truyen
//   .series-cover .content.img-in-ratio  bia (style background-image)
//   .series-type span                    "Truyện dịch" / "Sáng tác"
//   .series-information .info-item
//     span.info-name "Tác giả:" + span.info-value a  (co the khong co)
//     span.info-name "Tình trạng:" + span.info-value (link /oln-...)
//     a[href*="/the-loai/"]              the loai
//   .series-summary                      mo ta (sau h4 "Tóm tắt")
//   ul.list-chapters (toc.js dung)      muc luc day du theo volume
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

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("URL không hợp lệ: " + url);
    var target = toSiteUrl(url);

    var r = fetchDoclnDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten: .series-name a; fallback <title> (bo hau to site).
    var name = "";
    var nameEl = safeFirst(doc.select(".series-name a"));
    if (nameEl) name = cleanText(nameEl.text());
    if (!name) {
        var t = cleanText(String(doc.select("title").text() || ""));
        name = cleanText(t.replace(/\s*-\s*Cổng Light Novel.*$/, ""));
    }
    if (!name) return Response.error("Không đọc được tên truyện từ " + target);

    // Bia: .series-cover .content (style background-image hoac data-bg).
    var cover = "";
    var coverEl = safeFirst(doc.select(".series-cover .content.img-in-ratio"));
    if (!coverEl) coverEl = safeFirst(doc.select(".series-cover .content"));
    if (coverEl) cover = coverFromEl(coverEl);

    // Loai truyen: .series-type span ("Truyện dịch" / "Sáng tác").
    var kindLabel = "";
    var kindEl = safeFirst(doc.select(".series-type span"));
    if (kindEl) kindLabel = cleanText(kindEl.text());

    // Hang thong tin: tac gia / tinh trang (cac hang co the vang).
    var author = "";
    var status = "";
    var rows = doc.select(".series-information .info-item");
    for (var i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var labelEl = safeFirst(row.select("span.info-name"));
        var valueEl = safeFirst(row.select("span.info-value"));
        if (!labelEl || !valueEl) continue;
        var label = cleanText(labelEl.text());
        var value = cleanText(valueEl.text());
        if (label.indexOf("Tác giả") === 0) author = value;
        if (label.indexOf("Tình trạng") === 0) status = value;
    }

    // The loai: link /the-loai/... trong khoi thong tin.
    var genres = [];
    var seenG = {};
    var gSel = doc.select(".series-information a[href*=\"/the-loai/\"]");
    for (var j = 0; j < gSel.size(); j++) {
        var g = gSel.get(j);
        var gt = cleanText(g.text());
        var gh = toSiteUrl(String(g.attr("href") || ""));
        if (!gt || !gh || seenG[gh]) continue;
        seenG[gh] = 1;
        genres.push({ title: gt, input: gh, script: "gen.js" });
    }

    // Mo ta: .series-summary (bo dong tieu de "Tóm tắt").
    var desc = "";
    var sumEl = safeFirst(doc.select(".series-summary"));
    if (sumEl) {
        desc = cleanText(sumEl.text()).replace(/^\s*Tóm tắt\s*/, "");
    }
    if (!desc) {
        desc = cleanText(String(doc.select("meta[name=description]").attr("content") || ""));
    }
    if (desc.length > 800) desc = desc.slice(0, 800) + "...";

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (kindLabel) detailParts.push("Loại: " + kindLabel);
    if (status) detailParts.push("Tình trạng: " + status);

    // "Đang tiến hành" => dang ra; con lai (vd "Hoàn thành") => hoan thanh.
    var ongoing = status.indexOf("Đang tiến hành") !== -1;

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detailParts.join("<br>"),
        url: target,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
