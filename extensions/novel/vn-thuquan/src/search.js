// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Tim kiem bang GET tinh (kiem chung live 2026-11-16, tu VM):
// /Truyen/TimKiem/<tu-khoa>/Trang-<n> — tu khoa doi khoang trang thanh
// "-" (giong JS submit cua site), giu dau tieng Viet; site nhan ca dang
// co dau da encode ("Tây-Sơn") lan chu thuong ("tay-son") — ca hai deu
// tra 8 ket qua cho "Tay Son". Trang ket qua dung chung bo cuc card
// div.list.list-truyen nhu trang danh sach (20 sach/trang, "Trang N / M").
// Khong can WebView, khong can POST.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Hãy nhập từ khóa tìm kiếm.");
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(pRaw, 10);
    if (isNaN(pn) || pn < 1) pn = 1;

    var slug = k.replace(/\s+/g, "-");
    var target = BASE_URL + "/Truyen/TimKiem/" + encodeURIComponent(slug) + "/Trang-" + pn;

    var r = fetchVntqDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");
    var next = nextPageToken(r.doc);
    return Response.success(items, next);
}
