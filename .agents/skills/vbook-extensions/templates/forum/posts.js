// posts.js — noi dung cac bai trong mot thread (template forum).
// `url` la `link` cua thread; `page` la token lan goi truoc tra ve o data2
// (rong o lan dau). Tra ve 1 trang bai o data, token trang tiep o data2
// (rong khi het). De hien so trang + nhay trang: tra data dang object
// { posts, page, total_pages } va giu token la so trang ("1", "2", ...;
// lan dau `page` rong nghia la 1). Khong co total_pages thi app chi tai
// noi tiep tung trang.
// Moi bai co cac truong: id (hoac floor de dedup qua cac trang), floor,
// url (permalink), is_op, time, user (name bat buoc; them avatar, link,
// title...), content + content_format ("html" | "markdown").
// App KHONG dang bai, khong like, khong tra loi: nguon chi doc.
//
// Phan trang: doi theo site that. Nhieu dien dan dung ?page=N; XenForo
// dung /page-N trong duong dan (xem extensions/forum/otofun).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(url, page) {
    url = normalizeUrl(url);
    page = page || "1";

    var pageUrl = url + (url.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    var response = fetch(pageUrl);
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    var posts = doc.select("SELECTOR_POST_ITEMS").map(function (el) {
        return {
            id: el.attr("data-id"),
            floor: el.select("SELECTOR_POST_FLOOR").text(),
            url: el.select("SELECTOR_POST_PERMALINK").attr("href"),
            is_op: el.hasClass("op"),
            time: el.select("SELECTOR_POST_TIME").text(),
            user: {
                name: el.select("SELECTOR_USER_NAME").text(),
                avatar: el.select("SELECTOR_USER_AVATAR img").attr("src"),
                link: el.select("SELECTOR_USER_NAME a").attr("href")
            },
            content: el.select("SELECTOR_POST_CONTENT").html(),
            content_format: "html"
        };
    });

    var hasNext = !doc.select("SELECTOR_NEXT_PAGE").isEmpty();
    // Khi biet tong so trang (tuy chon; xoa neu site giau no):
    // return Response.success({ posts: posts, page: parseInt(page), total_pages: TOTAL }, next);
    return Response.success(posts, hasNext ? String(parseInt(page) + 1) : "");
}
