// search.js — tim kiem theo tu khoa cua 七猫免费小说 (qimao.com).
// API chinh thuc cua app (khao sat 2026-11-09, da kiem chung live tu VM
// + tren may that — xem qimao-api.js):
//   GET https://api-bc.wtzw.com/search/v1/words
//   params ky: {extend:"", tab:"0", gender:"0", refresh_state:"8",
//   page:"<N>", wd:"<tu khoa>", is_short_story_user:"0"}
//   data.books[]: {id, original_title/title (co the lan tag <font> highlight
//   — strip truoc khi hien), original_author/author, intro, image_link,
//   words_num, score, latest_chapter_title, latest_chapter_id}
//   data.meta.next_page: "2"... (het thi rong) — token trang ke.
// Tim kiem cua API la FUZZY (tim "错婚四十年" ra 11 ket qua, truyen dung
// dung thu 3) — extension tra dung thu tu API tra ve, khong tu loc,
// giong ixdzs8.
// Trang tim kiem web /search/index/?keyword= render bang JS nen KHONG
// dung lam nguon chinh (chi la du phong trong ghi chu).
//
// Load: build se copy crypto.js (built-in), config.js, config-helpers.js,
// fetch-helpers.js, qimao-api.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('crypto.js');
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('cleanHtml.js');
load('qimao-api.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var json = qimaoApiGet(QIMAO_API_BC, "/search/v1/words", {
        extend: "",
        tab: "0",
        gender: "0",
        refresh_state: "8",
        page: String(n),
        wd: query,
        is_short_story_user: "0"
    }, "00000000");
    if (!json) return Response.error("Không tải được kết quả tìm kiếm (lỗi mạng hoặc API 七猫 không trả về)");

    var data = json.data || {};
    var books = data.books || data.book_list || data.ret_data || [];
    if (!books || books.length === 0) {
        return Response.error("Không tìm thấy truyện '" + query + "'");
    }

    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < books.length; i++) {
        var b = books[i];
        var id = b.id || b.book_id || "";
        if (!id) continue;
        var link = BASE_URL + "/shuku/" + id + "/";
        if (seen[link]) continue;
        seen[link] = true;
        var name = stripTags(b.original_title || b.title || b.book_name || "");
        if (!name) continue;
        var author = b.original_author || b.author_name || b.author || "";
        var intro = b.intro || b.abstract || "";
        var latest = b.latest_chapter_title || "";
        var desc = cleanText(htmlDecode(intro));
        if (author) desc = author + (desc ? " — " + desc : "");
        if (latest) desc = desc ? desc + " | 最新: " + latest : "最新: " + latest;
        var tag = "";
        if (b.score) tag = String(b.score) + "分";
        if (b.words_num) tag = tag ? tag + " · " + b.words_num : String(b.words_num);
        var cover = b.image_link || b.thumb_url || b.cover || "";
        if (cover) cover = absUrl(cover);
        items.push({
            name: htmlDecode(name),
            cover: cover,
            link: link,
            description: desc,
            tag: tag,
            host: siteOrigin()
        });
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện '" + query + "'");

    var meta = data.meta || {};
    var next = meta.next_page ? String(meta.next_page) : "";
    return Response.success(items, next);
}
