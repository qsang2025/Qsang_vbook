load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
// detail.js — HHKUNGFU (hhkungfu.ee).
// Trang chi tiet: <h1> ten phim, <h2 class="org_title"> ten goc,
// img.film-poster-img = poster, meta og:image = anh goc chat luong cao,
// .list_cate a = the loai, .hh3d-new-ep .new-ep = tap moi nhat,
// .hh3d-info = "Tình trạng:" (Đang chiếu / Hoàn thành) + "Lượt xem:",
// .halim-entry-box article p = mo ta. Danh sach tap nam o toc.js.
function execute(url) {
    url = normalizeUrl(url);
    var response = fetchWithFallback(url);
    if (!response.ok) return Response.error("Không tải được trang phim (HTTP " + response.status + ")");
    var doc = response.html();

    var name = cleanText(doc.select("h1").first() ? doc.select("h1").first().text() : "");
    if (!name) return Response.error("Không tìm thấy tên phim");

    var cover = doc.select("meta[property=og:image]").attr("content");
    if (!cover) {
        var poster = doc.select("img.film-poster-img").first();
        if (poster !== null) cover = unwrapCover(poster.attr("src"));
    }

    var orig = "";
    var orgEl = doc.select("h2.org_title").first();
    if (orgEl !== null) orig = cleanText(orgEl.text());

    var desc = "";
    var descEl = doc.select(".halim-entry-box article p").first();
    if (descEl === null) descEl = doc.select(".entry-content p").first();
    if (descEl !== null) desc = cleanText(descEl.text());

    var latest = "";
    var newEp = doc.select(".hh3d-new-ep .new-ep").first();
    if (newEp !== null) latest = cleanText(newEp.text());

    var status = "";
    var views = "";
    doc.select(".hh3d-info").forEach(function (el) {
        // Chu y: el.select("div") tra ca chinh el (jsoup select bao gom
        // ban than phan tu), nen phai dung "> div" de lay div con truc tiep.
        var labelEl = el.select("> div").first();
        var label = labelEl !== null ? cleanText(labelEl.text()) : "";
        // Gia tri co the nam trong <div> (Tinh trang) hoac <span>
        // (Luot xem), nen lay toan bo text roi cat bo phan label.
        var full = cleanText(el.text());
        var value = full;
        if (label && full.indexOf(label) === 0) value = cleanText(full.substring(label.length));
        if (label.indexOf("Tình trạng") !== -1) status = value;
        if (label.indexOf("Lượt xem") !== -1) views = value;
    });

    var detailParts = [];
    if (orig) detailParts.push("Tên gốc: " + orig);
    if (status) detailParts.push("Tình trạng: " + status);
    if (latest) detailParts.push("Tập mới nhất: " + latest);
    if (views) detailParts.push("Lượt xem: " + views);

    var genres = [];
    doc.select(".list_cate a").forEach(function (el) {
        var t = cleanText(el.text());
        var href = el.attr("href");
        if (t && href) genres.push({ title: t, input: absUrl(href), script: "search.js" });
    });

    return Response.success({
        name: name,
        author: "",
        cover: cover,
        description: desc,
        detail: detailParts.join(" / "),
        url: url,
        type: "video",
        format: "series",
        ongoing: status.indexOf("Hoàn thành") === -1,
        genres: genres,
        suggests: [],
        reviews: [],
        comments: []
    });
}
