// search.js — Tìm kiếm truyện
// Contract: execute(key, page) → [{ name*, link*, cover?, description?, host? }], nextPage?
load("config.js");
load("rate-limit.js");
function execute(key, page) {
    if (!page) page = "1";

    var start = (parseInt(page) - 1) * 20;
    var url = BASE_URL + "/tim-kiem?q=" + encodeURIComponent(key) + "&qs=1&start=" + start;

    rateLimitDelay("wikicv.org");
    var res = wikiFetch(url);
    if (!res.ok) return Response.error("Không tải được trang tìm kiếm (HTTP " + res.status + ")");

    var doc = res.html();
    // Site chi tra ket qua tim kiem khi da dang nhap; chua dang nhap thi
    // trang chi la vo "Đăng nhập để xem nội dung" va 0 muc.
    if ((doc.text() + "").indexOf("Đăng nhập để xem nội dung") > -1) return Response.error("Tìm kiếm cần đăng nhập wikicv.org — đăng nhập bằng trình duyệt trong app rồi nhập cookie vào cài đặt wikicvCookie của nguồn.");
    var data = [];
    var seen = {};

    doc.select(".book-item").forEach(function (el) {
        var linkEl = el.select("a.cover-wrapper").first();
        if (!linkEl) return;

        var link = (linkEl.attr("href") || "") + "";
        if (!link || seen[link]) return;
        seen[link] = true;
        if (!link.startsWith("http")) link = BASE_URL + link;

        var imgEl = el.select("img").first();
        var cover = imgEl ? ((imgEl.attr("data-src") || imgEl.attr("src") || "") + "") : "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;

        var nameEl = el.select("h5.book-title").first();
        var name = (nameEl ? nameEl.text().trim() : "") + "";
        if (!name) return;

        data.push({
            name: name,
            link: link,
            cover: cover,
            description: "",
            host: BASE_URL
        });
    });

    var hasNext = false;
    doc.select(".pagination li a").forEach(function (el) {
        var href = (el.attr("href") || "") + "";
        if (!href || href.indexOf("#") > -1) return;
        if (href.indexOf("start=") > -1) hasNext = true;
    });

    return Response.success(data, hasNext ? String(parseInt(page) + 1) : "");
}