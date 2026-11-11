// detail.js — Thông tin chi tiết một truyện
// Contract: execute(url) → { name*, cover, host, author, description, ongoing:bool*,
//                             genres?:[{title,input,script}] }
// Chỉ trả tên + mô tả + thể loại; KHÔNG trả suggests (tránh mớ truyện không liên quan)
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = wikiNormalizeUrl(url);

    rateLimitDelay("wikicv.org");
    var res = wikiFetch(url);
    if (!res.ok) return Response.error("Không tải được trang (HTTP " + res.status + ")");

    var doc = res.html();

    // Tên truyện
    var nameEl = wikiFirst(doc.select(".cover-info h2"));
    var name = (nameEl ? nameEl.text().trim() : "") + "";
    // Bao loi ro thay vi tra success rong khi site doi selector.
    if (!name) return Response.error("Không lấy được tên truyện từ trang chi tiết — có thể site đã đổi giao diện.");

    // Ảnh bìa
    var coverEl = wikiFirst(doc.select(".book-info .cover-wrapper img"));
    var cover = "";
    if (coverEl) {
        cover = (coverEl.attr("data-src") || coverEl.attr("src") || "") + "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
    }

    // Tác giả: dòng p chứa "Tác giả:"
    var author = "";
    doc.select(".cover-info p").forEach(function (p) {
        var t = p.text() + "";
        if (t.indexOf("Tác giả") > -1) {
            var a = wikiFirst(p.select("a"));
            if (a) author = (a.text().trim()) + "";
        }
    });

    // Trạng thái: dòng p chứa "Tình trạng:"
    var status = "";
    doc.select(".cover-info p").forEach(function (p) {
        var t = p.text() + "";
        if (t.indexOf("Tình trạng") > -1) {
            var a = wikiFirst(p.select("a"));
            status = (a ? a.text().trim() : t.replace("Tình trạng:", "").trim()) + "";
        }
    });
    var ongoing = status.indexOf("Hoàn") === -1
        && status.indexOf("Completed") === -1
        && status.indexOf("Full") === -1
        && status.indexOf("完结") === -1;

    // Mô tả
    var descEl = wikiFirst(doc.select(".book-desc-detail"));
    var description = (descEl ? descEl.html() : "") + "";

    // Thể loại: dòng p đầu của .book-desc chứa các link
    var genres = [];
    var firstP = wikiFirst(doc.select(".book-desc > p"));
    if (firstP) {
        firstP.select("a").forEach(function (el) {
            var gTitle = (el.text().trim()) + "";
            var gHref = (el.attr("href") || "") + "";
            if (!gTitle || !gHref) return;
            if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
            genres.push({ title: gTitle, input: gHref, script: "book.js" });
        });
    }

    var result = {
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        ongoing: ongoing
    };
    if (genres.length > 0) result.genres = genres;

    // Bình luận (v5): API /comment không cần đăng nhập (khảo sát §12).
    // bookId lấy từ inline script trang chi tiết (cùng regex với toc.js,
    // không phụ thuộc tên biến/kiểu khai báo); số bình luận lấy từ
    // .book-stats (thứ tự: lượt xem, thích, bình luận — như wikiItemDescription).
    // Không lấy được bookId thì bỏ mục bình luận, detail vẫn trả bình thường.
    var bookId = "";
    doc.select("script").forEach(function (sc) {
        if (bookId) return;
        var code = (sc.html() || "") + "";
        var bm = code.match(/\b(?:var|let|const)?\s*bookId\s*=\s*"([^"]+)"/);
        if (bm) bookId = bm[1] + "";
    });
    var statNums = [];
    // Số bình luận của TRUYỆN CHÍNH nằm trong .cover-info .book-stats
    // (thứ tự: lượt xem, thích, bình luận). Các khối .book-stats-box thuộc
    // truyện tương tự bên dưới — selector cũ lấy nhầm số bình luận của
    // truyện tương tự đầu tiên. Ít hơn 3 số thì bỏ số khỏi title, không
    // bao giờ hiện số của truyện khác.
    doc.select(".cover-info .book-stats span[data-ready]").forEach(function (x) {
        statNums.push(((x.text().trim()) + ""));
    });
    if (bookId) {
        var cCount = statNums.length >= 3 ? statNums[2] : "";
        result.comment = {
            title: "Bình luận" + (cCount ? " (" + cCount + ")" : ""),
            input: bookId,
            script: "comment.js"
        };
    }
    return Response.success(result);
}