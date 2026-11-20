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
// Moi bai: id = permalink, floor = "#N" (da trim khoang trang thua),
// is_op = tac gia bai trung ten "Nguoi tao chu de" trong .p-description
// (VOZ KHONG danh dau OP bang icon/badge trong tung bai nhu Otofun —
// da probe 20/11: khong co "thot"/"starter"/"OP" trong HTML message,
// chi co ten OP o .p-description a.username tren moi trang),
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

    // Ten nguoi tao chu de (OP) — co tren moi trang trong .p-description.
    var opName = doc.select(".p-description a.username").text();

    var posts = [];
    doc.select(".message.message--post").map(function (el) {
        var perm = el.select(".message-attribution-main a");
        var body = el.select(".message-body .bbWrapper");
        var content = body.isEmpty() ? el.select(".message-body").html() : body.html();
        var nameEl = el.select(".message-name a.username");
        var authorName = nameEl.text();
        var floorText = el.select(".message-attribution-opposite a").text();
        floorText = floorText.replace(/^\s+|\s+$/g, "");

        posts.push({
            id: toAbs(perm.attr("href")),
            floor: floorText,
            url: toAbs(perm.attr("href")),
            is_op: (opName !== "" && authorName === opName),
            time: perm.text(),
            user: {
                name: authorName,
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
