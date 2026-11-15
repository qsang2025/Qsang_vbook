// gen.js — Danh sach truyen theo tab home.
//
// Input: duong dan duyet lite dang /novels, /novels?sort=new,
// /novels?sort=chapters, /novels?status=ongoing,
// /novels?status=completed (co the kem ca sort + status).
// Phan trang: token trang = gia tri after cua link "Next page"
// (/novels?after=<id>); tra "" khi het trang. Moi trang 24-36 truyen
// (td.novel-cell).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(input, page) {
    input = input || "";
    page = page || "";
    if (!input) return Response.error("Thiếu đường dẫn danh sách");

    var path = input;
    if (path.indexOf("http") === 0) {
        var mm = path.match(/^https?:\/\/[^\/]+(\/.*)$/);
        path = mm ? mm[1] : path;
    }
    // Bo after= cu neu input da kem (tranh ?after=201&after=159).
    path = path.replace(/([?&])after=[^&#]*(&|$)/, "$1").replace(/[?&]$/, "");

    var url = absUrl(listPageUrl(path, page));
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var items = parseNovelItems(rr.doc);
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + url);

    var next = nextAfterToken(rr.doc);
    return Response.success(items, next);
}
