// detail.js — thong tin chi tiet mot truyen tren Tadu.
// Selector kiem chung live 2026-11-12 (truyen 826953 + 658325):
//   ten: a.bkNm | tac gia: .bookNm span (co hau to " 著")
//   bia: a.bookImg img[data-src] (anh that; src la anh cho coverBg.jpg)
//   gioi thieu: p.intro | trang thai: meta og:novel:status (连载/完结)
//   so chuong: span.directory "目录（284章）" | chuong moi nhat:
//   meta og:novel:latest_chapter_name | so lieu: .datum (so chu, nhan khi)
//   the loai: .sortList a (khong co href nen tro ve search.js theo tu khoa).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = toWww(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được trang truyện (HTTP " + response.status + ")");

    var doc = response.html();
    var nameEl = safeFirst(doc.select("a.bkNm"));
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không đọc được thông tin truyện (site có thể đã đổi giao diện)");

    var author = "";
    var authorEl = safeFirst(doc.select(".bookNm span"));
    if (authorEl) {
        author = cleanText(authorEl.text()).replace(/\s*著\s*$/, "");
    }

    var cover = "";
    var imgEl = safeFirst(doc.select("a.bookImg img"));
    if (imgEl) {
        var src = imgEl.attr("data-src") || imgEl.attr("src");
        if (src && src.indexOf("coverBg") === -1) cover = fixCover(src);
    }

    var description = "";
    var descEl = safeFirst(doc.select("p.intro"));
    if (descEl) description = descEl.html();

    var status = doc.select("meta[property=og:novel:status]").attr("content");
    if (!status) {
        var lzEl = safeFirst(doc.select("span.lz"));
        if (lzEl) status = cleanText(lzEl.text());
    }
    status = cleanText(status);
    var ongoing = status !== "完结";

    var chapterCount = "";
    var dirEl = safeFirst(doc.select("span.directory"));
    if (dirEl) {
        var m = cleanText(dirEl.text()).match(/(\d+)\s*章/);
        if (m) chapterCount = m[1];
    }
    var latest = doc.select("meta[property=og:novel:latest_chapter_name]").attr("content");

    var datum = "";
    var datumEl = safeFirst(doc.select(".datum"));
    if (datumEl) datum = cleanText(datumEl.text());

    var genreTitles = [];
    var genres = [];
    doc.select(".sortList a").forEach(function (el) {
        var title = cleanText(el.text());
        // "无标签" = truyen khong co tag that — bo qua, khong map thanh
        // tu khoa tim kiem vo nghia.
        if (!title || title === "无标签") return;
        genreTitles.push(title);
        genres.push({ title: title, input: title, script: "search.js" });
    });

    var detail = genreTitles.join(" · ");
    var extra = [];
    if (datum) extra.push(datum);
    if (chapterCount) extra.push(chapterCount + "章");
    if (status) extra.push(status);
    if (latest) extra.push("Mới nhất: " + cleanText(latest));
    if (extra.length > 0) {
        detail = detail ? detail + "<br>" + extra.join(" · ") : extra.join(" · ");
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres
    });
}
