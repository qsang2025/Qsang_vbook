// book.js — renderer danh sach dung chung (template novel).
// Y tuong: SPRINGPEACHVINH — home.js chi 5 dong tro ve book.js lam renderer
// danh sach dung chung. home.js / genre.js / search.js deu route qua day:
//   - home.js tra ve cac tab { title, input, script: "search.js" };
//   - search.js goi listBooks(url, page) o day de tai va parse danh sach.
// Dieu chinh ROW_SELECTOR va cac selector con theo giao dien site that.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

// Selector dong truyen trong trang danh sach. Doi theo site that.
// storyItems() trong config-helpers.js dung selector nay lam mac dinh.
var ROW_SELECTOR = "div.d-flex, .story-item, li.list-row, .book-item";

// Tai mot trang danh sach va tra ve { items, next }.
// items: mang doi tuong truyen (name/cover/link/description/tag/host).
// next: so trang ke ("") = het, theo nextPageToken() trong config-helpers.js.
function listBooks(url, page) {
    var doc = fetchDoc(url);
    if (!doc) return { items: [], next: "", error: "Không tải được trang danh sách: " + url };
    var items = storyItems(doc, ROW_SELECTOR);
    var next = nextPageToken(doc);
    return { items: items, next: next, error: "" };
}

// Bien the tra Response truc tiep, dung trong search.js.
function listBooksResponse(url, page) {
    var result = listBooks(url, page);
    if (result.error) return Response.error(result.error);
    return Response.success(result.items, result.next);
}

function execute(query, page) {
    query = query || "";
    page = page || "1";
    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        // Tab duyet: query la duong dan chuyen muc hoac URL day du.
        url = query.indexOf("http") === 0 ? query : BASE_URL + query;
    } else if (query) {
        // Tu khoa (phong khi tab nao do tro thang vao book.js): tim kiem.
        url = BASE_URL + "/tim-kiem?q=" + encodeURIComponent(query);
    } else {
        url = BASE_URL;
    }
    return listBooksResponse(pagedUrl(url, page), page);
}
