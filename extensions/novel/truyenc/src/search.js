// search.js — Tim kiem truyen tren TruyenC
//
// Duong chinh: trang /tim-kiem HTML (SSR) + parseNovelCards() dung chung
// (card chinh la the <a>, khong leo .parent()). Tim-kiem cua site khong
// phan trang that: moi ket qua nam o trang 1, ?page=2 tra 0 muc (kiem
// chung bang curl 2026-11-08) — findNextPage() chi la luoi an toan, thuong
// tra "".
// Duong du phong: khi tim-kiem chinh tra 0 ket qua thi goi API tim kiem
// chinh thuc cua site (API_BASE/stories?q=..., frontend cua site dung cho
// autocomplete). Luu y: duong du phong cu cua v2
// (/danh-sach/truyen-moi-0-0-0?keyword=) da kiem chung la BO QUA keyword
// va tra danh sach truyen moi nhat — tra ket qua sai voi success — nen
// da BO, khong chay nua.
load('config.js');
load('fetch-helpers.js');

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }

    var currentPage = page ? parseInt(page, 10) : 1;
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
    var q = encodeURIComponent(String(key).trim());
    var url = BASE_URL + "/tim-kiem?q=" + q;
    if (currentPage !== 1) {
        url = url + "&page=" + currentPage;
    }

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) {
        // Khong tai duoc trang HTML (mang/site loi): thu duong API truoc
        // khi bao loi, vi API chay tren host khac (CloudFront).
        var apiList0 = searchApiFallback(String(key).trim(), currentPage);
        if (apiList0) {
            return Response.success(apiList0.items, apiList0.next);
        }
        return Response.error("Không thể kết nối đến máy chủ TruyenC.");
    }

    var novelList = parseNovelCards(doc);
    var next = findNextPage(doc, currentPage);

    if (novelList.length === 0) {
        var apiList = searchApiFallback(String(key).trim(), currentPage);
        if (apiList) {
            return Response.success(apiList.items, apiList.next);
        }
        return Response.error("Không tìm thấy truyện phù hợp với từ khóa \"" + String(key).trim() + "\".");
    }

    return Response.success(novelList, next);
}

// Duong du phong qua API tim kiem chinh thuc cua site.
// Tra ve { items: [...], next: "..." } hoac null khi API hong/0 ket qua.
function searchApiFallback(keyword, currentPage) {
    var apiUrl = API_BASE + "/stories?q=" + encodeURIComponent(keyword) + "&limit=20&page=" + currentPage;
    var data = fetchJson(apiUrl);
    if (!data || !data.data || data.data.length === 0) return null;
    var items = [];
    for (var i = 0; i < data.data.length; i++) {
        var s = data.data[i];
        if (!s || !s.slug || !s.title) continue;
        var desc = "";
        if (s.author_name) desc = "Tác giả: " + s.author_name;
        if (s.total_chapters) {
            if (desc) desc = desc + " • ";
            desc = desc + s.total_chapters + " chương";
        }
        if (s.status === "COMPLETED") desc = desc + " • Hoàn thành";
        items.push({
            name: s.title,
            link: BASE_URL + "/truyen/" + s.slug,
            cover: s.cover_image || "",
            description: desc,
            host: BASE_URL
        });
    }
    if (items.length === 0) return null;
    var next = "";
    if (data.meta && data.meta.total_pages && currentPage < data.meta.total_pages) {
        next = String(currentPage + 1);
    }
    return { items: items, next: next };
}
