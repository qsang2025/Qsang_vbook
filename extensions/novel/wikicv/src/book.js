// book.js — Danh sách truyện
// Contract: execute(url, page) → [{name*, link*, cover?, description?, host?, tag?}], nextPage?
// QUAN TRỌNG: nextPage phải là string, không phải số!
load("config.js");
load("rate-limit.js");
function execute(url, page) {
    if (!page) page = "1";

    // Normalize URL — thay domain nếu khác
    url = wikiNormalizeUrl(url);

    // Co trang cua tung loai danh sach: /review phan trang 10/trang,
    // cac danh sach khac 20/trang. {{page}} -> start=(page-1)*PAGE_SIZE.
    // URL khong co {{page}} (vd. the loai /tim-kiem?qs=2...) thi khi
    // page > 1 phai them/thay tham so start=, neu khong se fetch lai
    // dung URL trang 1 va app lap trang 1 vo han.
    var PAGE_SIZE = url.indexOf("/review") > -1 ? 10 : 20;
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var pageUrl;
    if (url.indexOf("{{page}}") > -1) {
        pageUrl = url.replace("{{page}}", String((pageNum - 1) * PAGE_SIZE));
    } else if (pageNum > 1) {
        var start = (pageNum - 1) * PAGE_SIZE;
        if (/[?&]start=\d+/.test(url)) {
            pageUrl = url.replace(/([?&]start=)\d+/, "$1" + start);
        } else {
            pageUrl = url + (url.indexOf("?") > -1 ? "&" : "?") + "start=" + start;
        }
    } else {
        pageUrl = url;
    }

    // Lay trang qua pacedFetch (file rate-limit.js): nghi jitter truoc
    // request, retry 429/405/503 toi da 3 lan, ghi cooldown khi bi chan.
    // Cookie dang nhap (neu co) gui kem qua headers — pacedFetch khong
    // tu them cookie cua wikiFetch.
    var pf = pacedFetch(pageUrl, { headers: wikiHeaders(pageUrl) });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Wiki Dịch", "wikicv.org", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được trang (HTTP " + pf.status + ")");
    }
    var res = pf.res;
    // Trang tim-kiem / bang-xep-hang khi chua dang nhap chi tra vo login
    // ("Đăng nhập để xem nội dung") va 0 muc — bao ro thay vi tra rong.

    var doc = res.html();
    if ((doc.text() + "").indexOf("Đăng nhập để xem nội dung") > -1) return Response.error("Trang này cần đăng nhập wikicv.org — đăng nhập bằng trình duyệt trong app rồi nhập cookie vào cài đặt wikicvCookie của nguồn.");
    var data = [];
    var seen = {};

    doc.select(".book-item").forEach(function (el) {
        // Link truyen: 2 bien the markup tuy trang.
        // - /chuong-moi, /truyen-nam...: a.tooltipped (h5.book-title nam trong).
        // - /review: a.book-title (h5 chi co class truncate tooltipped).
        // Thu ca 2 roi moi dung a.cover-wrapper (anh bia) lam du phong.
        // Tren /chuong-moi, a.cover-wrapper tro chapter URL nen KHONG dung
        // lam lua chon chinh — chi du phong khi 2 dang tren deu khong co.
        var linkEl = el.select("a.tooltipped").first();
        if (!linkEl) linkEl = el.select("a.book-title").first();
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

        // Ten truyen: h5.book-title tren cac list thuong; tren /review
        // class book-title nam o the a, h5 chi co truncate tooltipped
        // nen lay text cua chinh a.book-title; cuoi cung thu h5.truncate.
        // (Loi v2: chi thu h5.book-title nen /review tra ten rong va
        // toan bo muc bi bo qua — code 0 voi data [].)
        var nameEl = el.select("h5.book-title").first();
        if (!nameEl) nameEl = el.select("a.book-title").first();
        if (!nameEl) nameEl = el.select("h5.truncate").first();
        var name = (nameEl ? nameEl.text().trim() : "") + "";

        // Thể loại: p.book-gender (vd: Đam mỹ)
        var genderEl = el.select("p.book-gender").first();
        var tag = (genderEl ? genderEl.text().trim() : "") + "";

        if (!name) return;

        data.push({
            name: name,
            link: link,
            cover: cover,
            description: wikiItemDescription(el),
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