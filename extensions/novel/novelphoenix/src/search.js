// search.js — Tim kiem theo tu khoa: GET /search?keyword=<tu khoa>.
//
// Form cua site: input name="keyword", action /search. Ket qua dung cung
// mau div.li nhu trang danh sach (22 truyen/trang, phan trang ?page=N
// — them &page=N vi URL tim kiem da co query). Chi tra trang tiep theo
// khi con link phan trang toi trang ke.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    var url = absUrl(pageUrl("/search?keyword=" + encodeURIComponent(query), pageNum));
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var items = parseNovelItems(rr.doc);
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa: " + query);

    var next = nextPageToken(rr.doc, pageNum);
    return Response.success(items, next);
}
