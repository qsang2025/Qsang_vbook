// book.js — Danh sách truyện
// Contract: execute(url, page) → [{name*, link*, cover?, description?, host?, tag?}], nextPage?
// QUAN TRỌNG: nextPage phải là string, không phải số!
load("config.js");
load("rate-limit.js");
function execute(url, page) {
    if (!page) page = "1";

    // Normalize URL — thay domain nếu khác
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    // Phân trang dạng ?start=N (20/trang): {{page}} → start
    var pageUrl;
    if (url.indexOf("{{page}}") > -1) {
        var start = (parseInt(page) - 1) * 20;
        pageUrl = url.replace("{{page}}", String(start));
    } else {
        pageUrl = url;
    }

    rateLimitDelay("wikicv.org");
    var res = wikiFetch(pageUrl);
    if (!res.ok) return Response.error("Không tải được trang (HTTP " + res.status + ")");
    // Trang tim-kiem / bang-xep-hang khi chua dang nhap chi tra vo login
    // ("Đăng nhập để xem nội dung") va 0 muc — bao ro thay vi tra rong.

    var doc = res.html();
    if ((doc.text() + "").indexOf("Đăng nhập để xem nội dung") > -1) return Response.error("Trang này cần đăng nhập wikicv.org — đăng nhập bằng trình duyệt trong app rồi nhập cookie vào cài đặt wikicvCookie của nguồn.");
    var data = [];
    var seen = {};

    doc.select(".book-item").forEach(function (el) {
        // Link truyện: a.tooltipped chứa h5.book-title (trỏ detail)
        // Trên /chuong-moi, a.cover-wrapper trỏ chapter URL nên KHÔNG dùng
        var linkEl = el.select("a.tooltipped").first();
        if (!linkEl) linkEl = el.select("a.cover-wrapper").first();
        if (!linkEl) return;

        var link = (linkEl.attr("href") || "") + "";
        if (!link || seen[link]) return;
        seen[link] = true;
        if (!link.startsWith("http")) link = BASE_URL + link;

        // Ảnh bìa nằm trong cover-wrapper
        var imgEl = el.select("img").first();
        var cover = imgEl ? ((imgEl.attr("data-src") || imgEl.attr("src") || "") + "") : "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;

        // Tên truyện: h5.book-title (có thể trong a.tooltipped)
        var nameEl = el.select("h5.book-title").first();
        var name = (nameEl ? nameEl.text().trim() : "") + "";

        // Thể loại: p.book-gender (vd: Đam mỹ)
        var genderEl = el.select("p.book-gender").first();
        var tag = (genderEl ? genderEl.text().trim() : "") + "";

        if (!name) return;

        data.push({
            name: name,
            link: link,
            cover: cover,
            description: "",
            host: BASE_URL,
            tag: tag
        });
    });

    // Có trang kế tiếp khi tồn tại link phân trang có href != "#!" và khác trang hiện tại
    var hasNext = false;
    doc.select(".pagination li a").forEach(function (el) {
        var href = (el.attr("href") || "") + "";
        if (!href || href.indexOf("#") > -1) return;
        if (href.indexOf("start=") > -1) hasNext = true;
    });
    var nextPage = hasNext ? String(parseInt(page) + 1) : "";

    return Response.success(data, nextPage);
}