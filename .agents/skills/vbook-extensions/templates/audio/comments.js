// comments.js — binh luan cua mot truyen (template audio).
// Y tuong: Darkrai9x comments.js. Duoc goi tu detail.js qua truong
// `comments` ({title, input, script}).
// Phan trang: (input, page) -> (items, next). Moi item co the long
// `replies` (cung dang, de quy). Xem "comment scripts" trong extension-api.md.
// Tat ca SELECTOR_ doi theo giao dien site that.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute(input, page) {
    page = page || "1";
    var url = input.indexOf("http") === 0 ? input : BASE_URL + input;
    url += (url.indexOf("?") === -1 ? "?" : "&") + "page=" + page;

    var response = fetch(url);
    if (!response.ok) return Response.error("Lỗi HTTP " + response.status);
    var doc = response.html();

    var items = doc.select("SELECTOR_COMMENT_ITEMS").map(function (el) {
        return {
            name: el.select("SELECTOR_COMMENT_AUTHOR").text(),
            avatar: el.select("SELECTOR_COMMENT_AVATAR img").attr("src"),
            content: el.select("SELECTOR_COMMENT_CONTENT").html(),
            description: el.select("SELECTOR_COMMENT_TIME").text(),
            replies: el.select("SELECTOR_COMMENT_REPLIES SELECTOR_COMMENT_ITEMS").map(function (r) {
                return {
                    name: r.select("SELECTOR_COMMENT_AUTHOR").text(),
                    avatar: r.select("SELECTOR_COMMENT_AVATAR img").attr("src"),
                    content: r.select("SELECTOR_COMMENT_CONTENT").html(),
                    description: r.select("SELECTOR_COMMENT_TIME").text(),
                    replies: []
                };
            })
        };
    });

    var hasNext = !doc.select("SELECTOR_NEXT_PAGE").isEmpty();
    var nextPage = hasNext ? (parseInt(page) + 1).toString() : "";

    return Response.success(items, nextPage);
}
