// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
//
// Layout da kiem chung cua trang chi tiet storya.click/vi/stories/<slug>:
//   main h1                              ten truyen
//   meta[name="description"]             "Doc truyen <ten> full online mien
//                                          phi, N chuong, tac gia <ten>,
//                                          the loai A, B. <mo ta>..."
//   meta[property="og:image"]            bia (/media/covers/...)
//   a[href="/vi/genres/<slug>"]          the loai
//   main (text) co "Dang cap nhat"       => dang ra; khong co => hoan thanh
//                                          (site hau nhu toan truyen Hoan
//                                          Thanh — duong ongoing=true chua
//                                          gap that ngoai doi).
//   <title>                              "<ten> [Toi Chuong N] Full
//                                          (Hoan Thanh) | Storya" (so chuong
//                                          dung lam detail).
//
// Tai len: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var slug = extractSlug(url);
    if (!slug) return Response.error("URL không hợp lệ: " + url);
    var target = BASE_URL + "/vi/stories/" + slug;
    var r = fetchStoryaDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = cleanText(doc.select("main h1").text());
    if (!name) return Response.error("Không đọc được tên truyện từ " + target);

    var metaDescription = String(doc.select('meta[name="description"]').attr("content") || "");
    var cover = String(doc.select('meta[property="og:image"]').attr("content") || "");

    // The loai: link /vi/genres/<slug> tren trang chi tiet.
    var genres = [];
    var seenG = {};
    var gSel = doc.select('a[href*="/vi/genres/"]');
    for (var i = 0; i < gSel.size(); i++) {
        var g = gSel.get(i);
        var gh = String(g.attr("href") || "");
        var gm = /^\/vi\/genres\/([^\/\?#]+)$/.exec(gh);
        if (!gm || seenG[gm[1]]) continue;
        var gt = cleanText(g.text());
        if (!gt) continue;
        seenG[gm[1]] = 1;
        genres.push({ title: gt, input: BASE_URL + "/vi/genres/" + gm[1], script: "gen.js" });
    }

    // Tac gia + so chuong: tach tu meta description.
    var author = "";
    var authorMatch = /tác giả\s+([^,.]+)/i.exec(metaDescription);
    if (authorMatch) author = cleanText(authorMatch[1]);
    var chapterCount = "";
    var countMatch = /(\d[\d.,]*)\s*chương/i.exec(metaDescription);
    if (countMatch) chapterCount = countMatch[1];

    // Mo ta: bo phan mo dau "Doc truyen ... <mo ta>..." cua meta description.
    var desc = metaDescription;
    var descCut = metaDescription.indexOf(". ");
    if (descCut > 0) desc = metaDescription.substring(descCut + 2);
    desc = cleanText(desc);
    if (desc.length > 800) desc = desc.slice(0, 800) + "...";

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (chapterCount) detailParts.push("Số chương: " + chapterCount);
    if (genres.length > 0) {
        var gNames = [];
        for (var j = 0; j < genres.length; j++) gNames.push(genres[j].title);
        detailParts.push("Thể loại: " + gNames.join(", "));
    }

    var ongoing = String(doc.select("main").text() || "").indexOf("Đang cập nhật") >= 0;

    return Response.success({
        name: name,
        author: author,
        cover: cover ? toSiteUrl(cover) : "",
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
