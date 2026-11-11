// search.js — Tim kiem truyen AzTruyen (aztruyen.top).
//
// TIM KIEM CUA SITE HIEN DANG HONG (kiem chung live 2026-11-11, xem
// helper.js): GET /tim-kiem/<tu-khoa> tra trang loi voi MOI tu khoa,
// ke ca tu khoa site tu ghi trong "Tìm kiếm gần đây"; POST / voi
// search_q tra ve trang chu khong loc; khong co endpoint AJAX/goi y nao
// trong JS cua site. Vi vay tu khoa that thi tra Response.error ro rang
// bang tieng Viet (thay vi tra danh sach rong gay hieu lam la "khong co
// truyen"). Neu query la duong dan chuyen muc (bat dau "/" hoac "http")
// thi coi nhu duyet danh sach (phong khi tab nao do tro thang vao
// search.js) — nhanh nay van chay binh thuong.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    page = page || "";

    if (query.indexOf("http") === 0 || query.indexOf("/") === 0) {
        var listUrl = query.indexOf("http") === 0 ? query : BASE_URL + query;
        var lr = fetchAzDoc(listUrl);
        if (lr.error) return Response.error(lr.error);
        var litems = parseBookList(lr.doc, -1);
        if (litems.length === 0) return Response.success([], "");
        return Response.success(litems, azNextPage(lr.doc));
    }

    if (!query) return Response.error("Nhập từ khóa để tìm truyện.");

    return Response.error(AZ_SEARCH_BROKEN_MSG);
}
