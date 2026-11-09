// comment.js — doc danh sach binh luan cua truyen tren Truyen Full.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(input, page) {
    var url = normalizeUrl(input);
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    if (p > 1) {
        url = url.replace(/\/$/, "") + "/comment-page-" + p + "/#comments";
    }

    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được bình luận truyện: " + url);

    var comments = [];
    doc.select("#comments .comment-list > .item").forEach(function (el) {
        var aName = cleanText(el.select(".authorname").first() !== null ? el.select(".authorname").first().text() : "");
        var aDate = cleanText(el.select(".comment-date").first() !== null ? el.select(".comment-date").first().text() : "");
        var aContent = cleanText(el.select(".comment-content").first() !== null ? el.select(".comment-content").first().text() : "");
        var aAvatar = "";
        var avImg = el.select(".avatar-wrap img").first();
        if (avImg !== null) aAvatar = absUrl(avImg.attr("src") || avImg.attr("data-src") || "");
        if (aAvatar) aAvatar = aAvatar.replace(/^http:\/\//i, "https://");

        if (aContent) {
            comments.push({
                name: aName || "Vô danh",
                content: aContent,
                avatar: aAvatar,
                description: aDate
            });
        }
    });

    var nextPage = null;
    var navLinks = doc.select("#comments .nav-links a.page-numbers");
    var i = 0;
    for (i = 0; i < navLinks.size(); i++) {
        var pageNum = parseInt(cleanText(navLinks.get(i).text()), 10);
        if (!isNaN(pageNum) && pageNum > p) {
            nextPage = String(p + 1);
            break;
        }
    }

    return Response.success(comments, nextPage);
}
