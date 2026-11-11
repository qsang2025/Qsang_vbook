// detail.js — Thong tin chi tiet mot truyen Metruyenhotvn.
//
// Trang chi tiet `/<slug>/` (HTML tinh, kiem chung live 2026-11-11),
// moi thu nam trong khoi `.wrap-detail`:
// - Ten: `h1.title a` (du phong <title> bo hau to " - Y Lan"/tac gia).
// - Tac gia: `span[itemprop=author]` trong `.info`.
// - Bia: `img.lazyload[data-src]` trong `.wrap-detail` (site dung lazyload,
//   khong co og:image).
// - Mo ta: cac <p> trong `.content1` sau nhan "Thông tin chi tiết:".
// - The loai cua truyen: `span[itemprop=genre]`; link the loai lay tu
//   ban do ten -> href cua menu the loai tren cung trang (ten hien thi
//   khong luon khop slug — VD "Truyện Ma" -> /the-loai/truyen-ma-kinh-di/).
// - Trang thai: `span.status` ("Đang ra" / "Hoàn Thành"/"Full").
// - Tong so chuong: so chuong lon nhat trong cac link chuong tren trang
//   chi tiet (trang chi hien ~55 chuong moi nhat, nhung co link
//   "Chương mới nhất" toi chuong cuoi).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    // App cat dau "/" cuoi cua URL arg khi chay that; site dung URL co "/".
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl = detailUrl + "/";

    var r = fetchMthDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var titleEl = doc.select("h1.title a").first();
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) {
        var t = doc.title() || "";
        name = cleanText(t.split(" - ")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = "";
    var coverImg = doc.select(".wrap-detail img.lazyload").first();
    if (coverImg !== null) cover = coverImg.attr("data-src") || coverImg.attr("src") || "";
    if (!cover) {
        var anyImg = doc.select(".wrap-detail img").first();
        if (anyImg !== null) cover = anyImg.attr("data-src") || anyImg.attr("src") || "";
    }
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    var author = "";
    var authorEl = doc.select(".info span[itemprop=author]").first();
    if (authorEl !== null) author = cleanText(authorEl.text());

    // Ban do ten the loai -> href tu menu the loai tren trang.
    var genreHrefByName = {};
    doc.select("a[href*='/the-loai/']").forEach(function (el) {
        var href = el.attr("href") || "";
        var text = cleanText(el.text());
        var m = href.match(/\/the-loai\/([a-z0-9\-]+)/);
        if (!m || !text) return;
        var key = text.toLowerCase();
        if (!genreHrefByName[key]) genreHrefByName[key] = href;
    });

    var genres = [];
    var seenGenre = {};
    doc.select(".info span[itemprop=genre]").forEach(function (el) {
        var gTitle = cleanText(el.text());
        if (!gTitle) return;
        var gHref = genreHrefByName[gTitle.toLowerCase()] || "";
        if (!gHref) return;
        var gUrl = absUrl(gHref);
        if (!seenGenre[gUrl]) {
            seenGenre[gUrl] = true;
            genres.push({ title: gTitle, input: gUrl, script: "book.js" });
        }
    });

    var status = "";
    var statusEl = doc.select(".info span.status").first();
    if (statusEl !== null) status = cleanText(statusEl.text());

    // Tong so chuong = so chuong lon nhat trong cac link chuong tren trang.
    var total = 0;
    doc.select("a[href*='/chuong-']").forEach(function (el) {
        var href = el.attr("href") || "";
        var m = href.match(/\/chuong-(\d+)\//);
        if (!m) return;
        var n = parseInt(m[1], 10);
        if (!isNaN(n) && n > total) total = n;
    });

    var description = "";
    var contentEl = doc.select(".content1").first();
    if (contentEl !== null) {
        var infoEl = contentEl.select(".info").first();
        if (infoEl !== null) infoEl.remove();
        var fullText = cleanText(contentEl.text());
        description = fullText.replace(/^Thông tin chi tiết:\s*/i, "");
    }

    // Trang thai lay theo truong "Trạng thái" cua site (tin cay hon hau to
    // "(FULL)" trong ten — VD Long Thần Thượng Cổ co "(FULL)" trong ten
    // nhung site van ghi "Đang ra" va khong nam trong danh sach Truyen Full).
    var ongoing = true;
    if (/Full|Hoàn thành|Hoàn Thành/i.test(status)) {
        ongoing = false;
    }

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (genres.length > 0) {
        var gNames = [];
        var gi = 0;
        for (gi = 0; gi < genres.length; gi++) gNames.push(genres[gi].title);
        detailParts.push("Thể loại: " + gNames.join(", "));
    }
    detailParts.push("Trạng thái: " + (ongoing ? "Đang ra" : "Hoàn thành"));
    if (total > 0) detailParts.push("Số chương: " + total);

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join(" • "),
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
