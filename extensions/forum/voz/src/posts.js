// posts.js — noi dung cac bai trong mot thread (VOZ Forum, XenForo).
//
// `url` la `link` cua thread; `page` la token lan goi truoc tra ve o data2
// (rong o lan dau). Tra ve 1 trang bai o data dang { posts, page,
// total_pages } de app hien so trang + nhay trang, token trang tiep o data2.
//
// Phan trang: XenForo dung /page-N trong duong dan (KHONG dung ?page=N —
// ?page=2 tra lai bai cua trang 1). App cat dau "/" cuoi cua URL truoc khi
// truyen vao, nen tu noi lai "/" truoc khi ghep "page-N".
//
// Moi bai: id = permalink, floor = "#N", is_op = co icon "Chu thot",
// time = text trong link thoi gian, user.name bat buoc, content = HTML
// .bbWrapper. Nguon chi doc.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(url, page) {
    url = normalizeUrl(url);
    page = page || "1";

    var base = url;
    if (base.charAt(base.length - 1) !== "/") base += "/";
    var pageUrl = (page === "1") ? url : base + "page-" + page;

    var response = fetch(pageUrl);
    if (!response.ok) return Response.error("Không tải được bài viết (HTTP " + response.status + ")");
    var doc = response.html();

    var posts = [];
    doc.select(".message.message--post").map(function (el) {
        var perm = el.select(".message-attribution-main a");
        var body = el.select(".message-body .bbWrapper");
        var content = body.isEmpty() ? el.select(".message-body").html() : body.html();
        var nameEl = el.select(".message-name a.username");

        posts.push({
            id: toAbs(perm.attr("href")),
            floor: el.select(".message-attribution-opposite a").text(),
            url: toAbs(perm.attr("href")),
            is_op: !el.select(".message-name .icon-starter").isEmpty(),
            time: perm.text(),
            user: {
                name: nameEl.text(),
                link: toAbs(nameEl.attr("href")),
                title: el.select(".message-userTitle").text()
            },
            content: content,
            content_format: "html"
        });
        return null;
    });

    // Tong so trang = so lon nhat trong cac link /page-N cua pageNav.
    var totalPages = 1;
    doc.select(".pageNav a").map(function (a) {
        var m = a.attr("href").match(/page-(\d+)/);
        if (m) {
            var n = parseInt(m[1]);
            if (n > totalPages) totalPages = n;
        }
        return null;
    });

    var pageNum = parseInt(page);
    var next = (pageNum < totalPages) ? String(pageNum + 1) : "";
    return Response.success({ posts: posts, page: pageNum, total_pages: totalPages }, next);
}
