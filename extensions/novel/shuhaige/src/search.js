// search.js — tim kiem theo tu khoa cua 书海阁 (shuhaige.tw).
// RUI RO LON NHAT cua extension nay: form tim kiem la POST /search.html
// (field an searchtype=all + o text name="369koolearn", id bdcsMain,
// goi y Baidu CSE). POST tu VM TIMEOUT ca 3 lan (exit 28, 25s); GET
// /search.html?searchtype=articlename&369koolearn=... tra 200 nhung chi
// co form, khong ket qua (title "sodu小说搜索").
// Thu tu thu tren dien thoai that: (1) POST form, (2) GET, (3) mobile
// m.shuhaige.tw. Ket qua (neu co) dung 1 trong 3 layout cua helper.js
// (div.item / div.novelslist2 / div.top); tu khoa khop dung 1 truyen co
// the redirect ve trang detail — nhan ra bang meta og:novel:book_name
// va tra 1 item duy nhat lay tu OG meta (nhu sto9).
// Neu ca 3 cach deu khong tra ket qua thi tra loi ro rang (khong tu y
// drop search, khong bia selector ket qua).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function postSearchDoc(query) {
    var url = BASE_URL + "/search.html";
    try {
        var res = fetch(url, {
            method: "POST",
            headers: defaultHeaders(BASE_URL + "/"),
            body: { searchtype: "all", "369koolearn": query },
            timeout: 20000
        });
        if (!res || !res.ok) {
            console.log("search POST HTTP " + (res ? res.status : 0) + ": " + url);
            return null;
        }
        return res.html();
    } catch (e) {
        console.log("search POST loi: " + e);
        return null;
    }
}

function getSearchDoc(base, query) {
    var url = base + "/search.html?searchtype=articlename&369koolearn=" + encodeURIComponent(query);
    var res = fetchWithFallback(url, MIRROR_LIST);
    if (!res) return null;
    if (res.browser) return res.doc;
    try {
        return res.html();
    } catch (e) {
        return null;
    }
}

function parseResults(doc) {
    var items = [];
    var seen = {};
    function addItem(item) {
        if (!item || !item.link) return;
        if (seen[item.link]) return;
        seen[item.link] = true;
        items.push(item);
    }
    doc.select("div.item").forEach(function (el) { addItem(parseFeaturedItem(el)); });
    if (items.length === 0) {
        doc.select("div.novelslist2 ul li").forEach(function (el) { addItem(parseRowItem(el)); });
    }
    if (items.length === 0) {
        doc.select("div.novelslist div.top").forEach(function (el) { addItem(parseTopItem(el)); });
    }
    return items;
}

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;

    var doc = null;
    var tried = "";
    // (1) POST form — cach chinh cua site.
    if (n === 1) {
        doc = postSearchDoc(query);
        tried += "POST ";
    }
    // (2) GET — chi dung khi POST khong tra doc (khong chay song song).
    if (!doc) {
        doc = getSearchDoc(BASE_URL, query);
        tried += "GET ";
    }
    // (3) Mobile — du phong cuoi.
    if (!doc) {
        doc = getSearchDoc("https://m.shuhaige.tw", query);
        tried += "m.shuhaige.tw ";
    }
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm (đã thử: " + tried + ") — trang tìm kiếm của shuhaige.tw có thể chặn POST từ app, cần kiểm tra lại");

    // Redirect ve trang chi tiet (tu khoa khop dung 1 truyen):
    // trang detail co meta og:novel:book_name, trang ket qua thi khong.
    var ogName = doc.select('meta[property="og:novel:book_name"]').first();
    if (ogName !== null) {
        var name = cleanText(ogName.attr("content"));
        if (name) {
            var ogAuthor = doc.select('meta[property="og:novel:author"]').first();
            var ogImg = doc.select('meta[property="og:image"]').first();
            var ogLatest = doc.select('meta[property="og:novel:latest_chapter_name"]').first();
            var ogStatus = doc.select('meta[property="og:novel:status"]').first();
            var cover = "";
            if (ogImg !== null) {
                cover = ogImg.attr("content") || "";
                if (cover.indexOf("nocover") !== -1) cover = "";
                else if (cover) cover = absUrl(cover);
            }
            var ogId = doc.select('meta[property="og:book_id"]').first();
            var bookId = ogId !== null ? cleanText(ogId.attr("content")) : "";
            var item = {
                name: htmlDecode(name),
                cover: cover,
                link: bookId ? BASE_URL + "/" + bookId + ".html" : BASE_URL + "/",
                description: ogLatest !== null ? cleanText(ogLatest.attr("content")) : "",
                tag: ogStatus !== null ? cleanText(ogStatus.attr("content")) : "",
                host: siteOrigin()
            };
            if (ogAuthor !== null) item.description = cleanText(ogAuthor.attr("content")) + (item.description ? " — " + item.description : "");
            return Response.success([item], "");
        }
    }

    var items = parseResults(doc);
    if (items.length === 0) {
        return Response.error("Tìm kiếm không trả kết quả cho '" + query + "' (đã thử: " + tried + ") — trang tìm kiếm của shuhaige.tw có thể dùng Baidu CSE và chặn request từ app");
    }

    // Phan trang tim kiem: chi theo link ke that neu co, khong doan pattern.
    var next = "";
    var nextLink = doc.select("a:contains(下一页)").first();
    if (nextLink === null) nextLink = doc.select("a:contains(下一頁)").first();
    if (nextLink !== null) {
        var href = nextLink.attr("href");
        if (href && href.indexOf("http") !== 0 && href.charAt(0) === "/") {
            next = href;
        }
    }
    return Response.success(items, next);
}
